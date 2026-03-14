import { supabase } from "./supabase";

export async function loadUserData(userId) {

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: weights } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", userId);

  const weightLogsByDate = {};

  if (weights) {
    weights.forEach(w => {
      weightLogsByDate[w.log_date] = w.weight;
    });
  }

  return {
    profile: {
      name: profile?.name,
      bodyType: profile?.body_type,
      heightCm: profile?.height_cm,
      currentWeight: profile?.current_weight,
      targetWeight: profile?.target_weight,
      planLossRateKgPerWeek: profile?.plan_loss_rate,
      note: profile?.note
    },
    progress: {
      weightLogsByDate
    }
  };
}