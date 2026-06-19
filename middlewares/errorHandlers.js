export const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err?.message,
    name: err?.name,
    stack: err?.stack,
    code: err?.code,
    err,
  });

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};
