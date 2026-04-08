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
  front: 0,
  closeup: 1,
  right: 2,
  left: 3,
  back: 4,
  sheet: 10,
  master: 0,
  closeup_left: 11,
  closeup_right: 13,
};

export const PACK_VIEWS = [
  { key: "front", label: "Front Full Body", sortOrder: 0, size: "1024x1536" },
  { key: "closeup", label: "Front Upper Close", sortOrder: 1, size: "1024x1536" },
  { key: "right", label: "Right Side Profile", sortOrder: 2, size: "1024x1536" },
  { key: "left", label: "Left Side Profile", sortOrder: 3, size: "1024x1536" },
  { key: "back", label: "Back Side Profile", sortOrder: 4, size: "1024x1536" },
  { key: "sheet", label: "All Profiles Sheet", sortOrder: 10, size: "1536x1024" },
  { key: "closeup_left", label: "Left Profile Portrait", sortOrder: 11, size: "1024x1536" },
  { key: "closeup_right", label: "Right Profile Portrait", sortOrder: 13, size: "1024x1536" },
];
