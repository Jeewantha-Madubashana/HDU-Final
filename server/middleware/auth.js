import jwt from "jsonwebtoken";

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const xAuthToken = req.header("x-auth-token");

  let token;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (xAuthToken) {
    token = xAuthToken;
  }

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

export const authorize = (roles = []) => {
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: "Unauthorized - No user found" });
    }


    if (roles.length && !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ 
          msg: "Forbidden - Insufficient permissions",
          userRole: req.user.role,
          requiredRoles: roles
        });
    }

    next();
  };
};
