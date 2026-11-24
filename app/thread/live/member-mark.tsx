// The small mark by a member's name (optional accounts): the name is reserved by a signed-in player. Quiet on purpose.
export function MemberMark() {
  return <span className="th-member" title="Member: this name is reserved" aria-label="Member">✓</span>;
}
