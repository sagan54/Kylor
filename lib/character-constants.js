export const IMAGE_TYPES = {
  MASTER: "master",
  FRONT: "front",
  LEFT: "left",
  RIGHT: "right",
  BACK: "back",
  CLOSEUP: "closeup",
};

export const IMAGE_ORDER = {
  master: 0,
  front: 1,
  left: 2,
  right: 3,
  back: 4,
  closeup: 5,
};

export const PACK_VIEWS = [
  { key: "front", label: "Front Full-Body", sortOrder: 1 },
  { key: "left", label: "Left Profile Full-Body", sortOrder: 2 },
  { key: "right", label: "Right Profile Full-Body", sortOrder: 3 },
  { key: "back", label: "Back Full-Body", sortOrder: 4 },
  { key: "closeup", label: "Close-Up Portrait", sortOrder: 5 },
];