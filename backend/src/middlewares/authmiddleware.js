const jwt =
  require("jsonwebtoken");

module.exports =
  async (req, res, next) => {

  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {

      return res.status(401).json({

        success: false,

        message:
          "Token não enviado"

      });

    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      jwt.verify(

        token,

        process.env.JWT_SECRET

      );

    req.admin = decoded;

    next();

  } catch (error) {

    return res.status(401).json({

      success: false,

      message:
        "Token inválido"

    });

  }

};