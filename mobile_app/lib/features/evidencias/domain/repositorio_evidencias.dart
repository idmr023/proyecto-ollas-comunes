import '../../../core/red/resultado.dart';

/// Datos de una evidencia a subir (foto + metadatos).
class DatosEvidencia {
  const DatosEvidencia({
    required this.nombreArchivo,
    required this.tipoArchivo,
    required this.titulo,
    required this.base64,
    this.descripcion,
  });

  final String nombreArchivo;
  final String tipoArchivo;
  final String titulo;
  final String base64;
  final String? descripcion;
}

/// Contrato del repositorio de evidencias documentales.
abstract interface class RepositorioEvidencias {
  Future<Resultado<void>> subir(DatosEvidencia datos);
}
