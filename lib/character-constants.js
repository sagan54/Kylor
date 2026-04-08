export const IMAGE_TYPES = {
  SHEET: "sheet",
  MASTER: "master",
  FRONT: "front",
  LEFT: "left",
  RIGHT: "right",
  BACK: "back",
  CLOSEUP_LEFT: "closeup_left",
  CLOSEUP: "closeup",
  CLOSEUP_RIGHT: "closeup_right",
};

export const IMAGE_ORDER = {
  sheet: 0,
  master: 0,
  front: 1,
  left: 2,
  right: 3,
  back: 4,
  closeup_left: 5,
  closeup: 6,
  closeup_right: 7,
};

export const PACK_VIEWS = [
  { key: "sheet", label: "All Profiles Sheet", sortOrder: 0, size: "1536x1024" },
  { key: "front", label: "Front Full-Body", sortOrder: 1, size: "1024x1536" },
  { key: "left", label: "Left Profile Full-Body", sortOrder: 2, size: "1024x1536" },
  { key: "right", label: "Right Profile Full-Body", sortOrder: 3, size: "1024x1536" },
  { key: "back", label: "Back Full-Body", sortOrder: 4, size: "1024x1536" },
  { key: "closeup_left", label: "Left Profile Portrait", sortOrder: 5, size: "1024x1536" },
  { key: "closeup", label: "Front Portrait", sortOrder: 6, size: "1024x1536" },
  { key: "closeup_right", label: "Right Profile Portrait", sortOrder: 7, size: "1024x1536" },
];
