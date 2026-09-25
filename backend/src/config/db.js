// archivo de conexión a la base de datos

//carga el módulo mongoose para conectarse a MongoDB
const mongoose = require("mongoose");

//función para conectarse a la base de datos
const connectDB = async () => {
  try {
    //obtiene la URI de conexión desde las variables de entorno o usa una URI por defecto en caso de no haberla definido
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/umdb";
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB arriba");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
    process.exit(1);
  }
};

//exporta la función de conexión para que pueda ser utilizada en otros archivos
module.exports = connectDB;
