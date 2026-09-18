import type {
  DailyAdvice,
  DailyContext,
  DietAdvice,
  TrainingAdvice,
} from "./advice";
import { ADVICE_CONFIG, ADVICE_ENGINE_VERSION } from "./adviceConfig";
import { defaultMealType, mealLabel } from "./food";
import { localDateISO } from "./shortcutSync";
import {
  consecutiveHighIntensityDays,
  dayHasTrainedKind,
  isHighIntensityDay,
} from "./trainingLoad";

export function computeAdvice(ctx: DailyContext): DailyAdvice {
  const foodKcal = Math.round(ctx.food.kcal);
  const proteinG = ctx.food.protein;
  const watchActiveKcal = ctx.health?.activeKcal ?? 0;
  const remainingKcal = ctx.targets.targetKcal - foodKcal;
  const numbers = {
    targetKcal: ctx.targets.targetKcal,
    foodKcal,
    watchActiveKcal,
    remainingKcal,
    proteinG,
    proteinTargetG: ctx.targets.proteinG,
  };
  return {
    diet: dietCards(ctx, remainingKcal, foodKcal, proteinG),
    training: trainingCard(ctx),
    numbers,
  };
}

export function adviceFingerprint(ctx: DailyContext): string {
  const hourBucket = Math.floor(ctx.now.getHours() / 3);
  const workouts = (ctx.health?.workouts ?? [])
    .map((item) => `${item.type}:${item.minutes ?? 0}`)
    .join(",");
  const recent = ctx.recentDays
    .map((day) => `${day.date}:${isHighIntensityDay(day) ? 1 : 0}`)
    .join(";");
  const plan = (ctx.plannedToday?.items ?? [])
    .map((item) => `${item.kind}:${item.done ? 1 : 0}:${item.synced ? 1 : 0}`)
    .join(",");
  return [
    ADVICE_ENGINE_VERSION,
    localDateISO(ctx.now),
    ctx.profile.goal,
    ctx.targets.targetKcal,
    ctx.targets.proteinG,
    ctx.food.kcal,
    ctx.food.protein,
    ctx.health?.activeKcal ?? "none",
    workouts,
    recent,
    plan,
    hourBucket,
    ctx.targets.forcedMaintainBecauseMinor ? "minor" : "adult",
  ].join("|");
}

function dietCards(
  ctx: DailyContext,
  remainingKcal: number,
  foodKcal: number,
  proteinG: number,
): DietAdvice[] {
  const hour = ctx.now.getHours();
  const overBy = foodKcal - ctx.targets.targetKcal;
  const lastMeal = hour >= ADVICE_CONFIG.lastMealHour;
  const minor = ctx.targets.forcedMaintainBecauseMinor;
  const cards: DietAdvice[] = [];

  if (overBy > ADVICE_CONFIG.overTargetKcal) {
    const avoid = overBy >= ADVICE_CONFIG.avoidOverTargetKcal || lastMeal;
    cards.push({
      action: avoid ? "avoid" : "reduce",
      target: lastMeal ? "加餐" : "晚餐油脂",
      detail: minor
        ? `今天已经比维持热量多 ${overBy} kcal，后面选清淡的，不要靠节食补回来。`
        : avoid
          ? `今日已超目标 ${overBy} kcal，这顿先不吃零食和高油，白开水或清淡蔬菜即可。`
          : `今日已超目标 ${overBy} kcal，下一餐少油少糖，主食减半。`,
      reason: "intake_over_target",
      priority: 1,
    });
  }

  const proteinLow = proteinG < ctx.targets.proteinG * ADVICE_CONFIG.proteinLowRatio;
  if (proteinLow && !lastMeal) {
    cards.push({
      action: "increase",
      target: "蛋白",
      detail: `蛋白才 ${Math.round(proteinG)} g，目标 ${ctx.targets.proteinG} g，下一餐加鸡胸、蛋、奶或瘦肉。`,
      reason: "protein_low",
      priority: 2,
    });
  }

  const upcoming = approachingMeal(hour);
  if (
    overBy <= ADVICE_CONFIG.overTargetKcal &&
    remainingKcal >= 0 &&
    remainingKcal <= ADVICE_CONFIG.remainingTightKcal &&
    upcoming
  ) {
    cards.push({
      action: "reduce",
      target: upcoming === "lunch" ? "午餐主食" : "晚餐油脂",
      detail: `到${mealLabel(upcoming)}前只剩 ${remainingKcal} kcal，主食减半、少油，优先吃菜和蛋白。`,
      reason: "remaining_tight",
      priority: 3,
    });
  }

  const todayWorkouts = ctx.health?.workouts ?? todayLoad(ctx).workouts;
  const hiToday = isHighIntensityDay({
    date: localDateISO(ctx.now),
    activeKcal: ctx.health?.activeKcal ?? 0,
    workouts: todayWorkouts,
  });
  if (hiToday && overBy <= ADVICE_CONFIG.overTargetKcal && remainingKcal > 200) {
    cards.push({
      action: "increase",
      target: "碳水",
      detail: "今天已经有高强度训练，后面加一份米饭或水果，不必再加大赤字。",
      reason: "post_hard_session",
      priority: 4,
    });
  }

  if (cards.length === 0) {
    if (remainingKcal > ADVICE_CONFIG.overTargetKcal) {
      const next = lastMeal ? "加餐" : mealLabel(defaultMealType(ctx.now));
      cards.push({
        action: "increase",
        target: next,
        detail: `还剩 ${remainingKcal} kcal、蛋白 ${Math.round(proteinG)}/${ctx.targets.proteinG} g，按目标把${next}吃够即可。`,
        reason: "remaining_to_fill",
        priority: 5,
      });
    } else {
      cards.push({
        action: "reduce",
        target: "零食",
        detail:
          remainingKcal >= 0
            ? "热量还在目标内，后面别加零食和高油。"
            : "已经贴着目标，后面只喝水或清淡蔬菜。",
        reason: "maintain_course",
        priority: 5,
      });
    }
  }

  return cards.sort((a, b) => a.priority - b.priority);
}

function trainingCard(ctx: DailyContext): TrainingAdvice {
  const minor = ctx.targets.forcedMaintainBecauseMinor;
  const planTitle = ctx.plannedToday?.title;
  const workouts = todayLoad(ctx).workouts;
  const streak = consecutiveHighIntensityDays(ctx.recentDays);

  if (streak >= 3) {
    return {
      action: "rest",
      title: "休息日",
      detail: minor
        ? "最近三天都练得比较猛，今天散步或完全休息，不要再上高强度。"
        : "连续 3 天高强度，今天休息或只走路，让关节和睡眠跟上。",
      reason: "consecutive_high_intensity",
    };
  }

  const cardioDone = dayHasTrainedKind(workouts, "cardio");
  const strengthDone = dayHasTrainedKind(workouts, "strength");
  const planHardDone = Boolean(
    ctx.plannedToday?.items.length &&
      ctx.plannedToday.items
        .filter((item) => item.kind === "strength" || item.kind === "cardio")
        .every((item) => item.done || item.synced),
  );

  if (cardioDone || strengthDone || planHardDone) {
    if (ctx.profile.goal === "lose" && !minor && cardioDone && !strengthDone) {
      return {
        action: "easy_cardio",
        title: "只走路",
        detail: "今天已经有氧超过 30 分钟，不要再跑；可以散步收工。力量留到计划日，用手表「健身」开始。",
        reason: "already_trained",
      };
    }
    return {
      action: "rest",
      title: "恢复",
      detail: cardioDone
        ? "手表已经记到足够有氧，不要再叠同等跑步。拉伸、走路即可。"
        : "今天力量已经练过，不要再加一组大重量，恢复为主。",
      reason: "already_trained",
    };
  }

  const yesterday =
    ctx.recentDays.length >= 2 ? ctx.recentDays[ctx.recentDays.length - 2] : undefined;
  if (yesterday && isHighIntensityDay(yesterday)) {
    return {
      action: "shorten",
      title: planTitle ? `${planTitle}（缩短）` : "轻松力量 25 分钟",
      detail: "近两天刚练过高强度，今天缩短时间、少做组，不要再上长距离有氧。运动用手表健身开始。",
      reason: "recent_high_intensity",
    };
  }

  const dietOnTrack = ctx.food.kcal <= ctx.targets.targetKcal + ADVICE_CONFIG.overTargetKcal;
  const lowActivity =
    ctx.health !== null && ctx.health.activeKcal < ADVICE_CONFIG.lowActivityKcal;
  if (ctx.profile.goal === "lose" && !minor && lowActivity && dietOnTrack) {
    return {
      action: "easy_cardio",
      title: "步行 30–40 分钟",
      detail: "饮食还在目标内，但活动偏低。用手表「步行」补一段低强度，不要再加跑步课。",
      reason: "low_activity_on_cut",
    };
  }

  if (ctx.profile.goal === "gain" && !minor) {
    return {
      action: "add_strength",
      title: planTitle ?? "全身力量 45 分钟",
      detail: "手表还没有高强度记录，按计划练力量；请在手表「健身」里开始，网页不记心率。",
      reason: "planned_session_pending",
    };
  }

  return {
    action: "follow_plan",
    title: planTitle ?? defaultPlanTitle(ctx.profile.goal, minor),
    detail: minor
      ? "按维持活动即可，不要为了减重加高强度。运动用手表健身开始。"
      : "手表今日尚无高强度锻炼，按计划练；跑跳请用系统健身，网页不负责心率。",
    reason: "planned_session_pending",
  };
}

function todayLoad(ctx: DailyContext) {
  const today = localDateISO(ctx.now);
  return (
    ctx.recentDays.find((day) => day.date === today) ?? {
      date: today,
      activeKcal: ctx.health?.activeKcal ?? 0,
      workouts: ctx.health?.workouts ?? [],
    }
  );
}

function approachingMeal(hour: number): "lunch" | "dinner" | null {
  if (hour >= ADVICE_CONFIG.lunchApproachStart && hour < ADVICE_CONFIG.lunchApproachEnd) {
    return "lunch";
  }
  if (hour >= ADVICE_CONFIG.dinnerApproachStart && hour < ADVICE_CONFIG.dinnerApproachEnd) {
    return "dinner";
  }
  return null;
}

function defaultPlanTitle(goal: DailyContext["profile"]["goal"], minor: boolean): string {
  if (minor) return "轻松活动 30 分钟";
  if (goal === "lose") return "力量 40 分钟 + 可步行";
  if (goal === "gain") return "全身力量 45 分钟";
  return "全身训练 40 分钟";
}
