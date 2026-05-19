export default function errorHandler(err, req, res, _next) {
  console.error(`[Error] ${req.method} ${req.url}:`, err.message);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大50MB）',
      });
    }
    return res.status(400).json({
      success: false,
      message: `文件上传错误: ${err.message}`,
    });
  }

  const status = err.statusCode || 500;
  const message = status === 500 ? '服务器内部错误' : err.message;

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
