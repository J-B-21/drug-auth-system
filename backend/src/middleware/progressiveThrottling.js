const abuseDetectionService = require('../services/abuseDetection.service');

const progressiveThrottling = (req, res, next) => {
  try {
    const assessment = abuseDetectionService.assessRequest({
      req,
      payload: req.body,
    });

    req.securityFlags = assessment.securityFlags;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = progressiveThrottling;
