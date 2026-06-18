import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Guarda y recupera el token JWT de la sesión de forma segura en el
/// almacenamiento cifrado del dispositivo.
class AlmacenSesion {
  AlmacenSesion(this._almacen);

  static const String _claveToken = 'sigo_ollas_jwt';

  final FlutterSecureStorage _almacen;

  Future<void> guardarToken(String token) {
    return _almacen.write(key: _claveToken, value: token);
  }

  Future<String?> obtenerToken() {
    return _almacen.read(key: _claveToken);
  }

  Future<bool> tieneSesion() async {
    final String? token = await obtenerToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> cerrarSesion() {
    return _almacen.delete(key: _claveToken);
  }
}
