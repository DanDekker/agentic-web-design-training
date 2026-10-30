// A claims portal interpolates user text into a fixed-direction panel.
export function renderSupportIntake(input: any): string {
  return `<section dir="${input.direction}"><h2>${input.reference}</h2><input value="${input.name}"><textarea>${input.notes}</textarea></section>`;
}
