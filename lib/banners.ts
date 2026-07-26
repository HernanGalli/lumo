interface BannerScheduleRow {
  starts_at: string | null;
  ends_at: string | null;
}

export function isBannerActiveNow<T extends BannerScheduleRow>(banner: T): boolean {
  const now = Date.now();
  const startsOk = !banner.starts_at || new Date(banner.starts_at).getTime() <= now;
  const endsOk = !banner.ends_at || new Date(banner.ends_at).getTime() >= now;
  return startsOk && endsOk;
}
