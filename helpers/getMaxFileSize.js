const FILE_LIMITS = {
  image: 10 * 1024 * 1024,
  audio: 40 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  "application/pdf": 20 * 1024 * 1024,
  default: 10 * 1024 * 1024,
};

const getMaxFileSize = (mimetype) => {
  if (mimetype.startsWith("image/")) {
    return FILE_LIMITS.image;
  }

  if (mimetype.startsWith("audio/")) {
    return FILE_LIMITS.audio;
  }

  if (mimetype.startsWith("video/")) {
    return FILE_LIMITS.video;
  }

  return FILE_LIMITS[mimetype] ?? FILE_LIMITS.default;
};

module.exports = getMaxFileSize;
