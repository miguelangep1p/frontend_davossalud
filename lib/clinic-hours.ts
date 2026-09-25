// Professionals are available for the whole clinic day; there are no shifts.
export const CLINIC_OPENING_TIME = "07:00";
export const CLINIC_CLOSING_TIME = "22:00";
export const SLOT_MINUTES = 30;

export function timeToMins(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

export function minsToTime(mins: number) {
  const hours = Math.floor(mins / 60).toString().padStart(2, "0");
  const minutes = (mins % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Every slot start between opening and closing, e.g. 07:00, 07:30 … 21:30. */
export const CLINIC_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (
    let mins = timeToMins(CLINIC_OPENING_TIME);
    mins < timeToMins(CLINIC_CLOSING_TIME);
    mins += SLOT_MINUTES
  ) {
    slots.push(minsToTime(mins));
  }
  return slots;
})();

export function fitsClinicDay(startTime: string, durationMins: number) {
  return (
    timeToMins(startTime) >= timeToMins(CLINIC_OPENING_TIME) &&
    timeToMins(startTime) + durationMins <= timeToMins(CLINIC_CLOSING_TIME)
  );
}

export function formatDuration(mins: number) {
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** Local YYYY-MM-DD (toISOString would shift the date after 7 pm in Peru). */
export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
