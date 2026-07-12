import 'package:dio/dio.dart';
import '../../../core/red/cliente_http.dart';
import '../../../core/red/resultado.dart';
import '../domain/repositorio_evidencias.dart';

/// Implementación del [RepositorioEvidencias] sobre POST /mobile/documents/upload.
class EvidenciasRepositorioImpl implements RepositorioEvidencias {
  EvidenciasRepositorioImpl(this._cliente);

  static const String _tipoDocumento = 'evidence';

  final ClienteHttp _cliente;

  @override
  Future<Resultado<void>> subir(DatosEvidencia datos) async {
    try {
      await _cliente.publicar(
        '/mobile/documents/upload',
        cuerpo: <String, dynamic>{
          'fileName': datos.nombreArchivo,
          'fileType': datos.tipoArchivo,
          'documentType': _tipoDocumento,
          'title': datos.titulo,
          'base64Data': datos.base64,
          if (datos.descripcion != null && datos.descripcion!.isNotEmpty)
            'description': datos.descripcion,
        },
      );
      return const Resultado<void>.exito(null);
    } on DioException catch (err) {
      return Resultado<void>.fallo(ClienteHttp.traducirError(err));
    }
  }
}
