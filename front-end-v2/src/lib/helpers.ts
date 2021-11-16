export function parseTimes(on: string, off: string, timeNow: Date) {
  const on_diff = timeNow.getHours() - parseInt(on.split(":")[0]);
  if (on_diff < 0) return false;
  if (on_diff < 1)
    if (parseInt(on.split(":")[1]) >= timeNow.getMinutes()) return false;
  const off_diff = parseInt(off.split(":")[0]) - timeNow.getHours();
  if (off_diff < 0) return false;
  if (off_diff < 1)
    if (parseInt(off.split(":")[1]) <= timeNow.getMinutes()) return false;
  return true;
}
