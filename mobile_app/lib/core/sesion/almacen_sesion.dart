import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Contrato minimo para guardar datos sensibles de sesion.
abstract class PersistenciaSesion {
  Future<void> escribir({required String clave, required String valor});
  Future<String?> leer({required String clave});
  Future<void> eliminar({required String clave});
}

/// Adaptador del almacenamiento seguro del dispositivo.
class PersistenciaSesionSecureStorage implements PersistenciaSesion {
  PersistenciaSesionSecureStorage(this._almacen);

  final FlutterSecureStorage _almacen;

  @override
  Future<void> escribir({required String clave, required String valor}) {
    return _almacen.write(key: clave, value: valor);
  }

  @override
  Future<String?> leer({required String clave}) {
    return _almacen.read(key: clave);
  }

  @override
  Future<void> eliminar({required String clave}) {
    return _almacen.delete(key: clave);
  }
}

/// Guarda y recupera el token JWT de la sesion de forma segura.
class AlmacenSesion {
  AlmacenSesion(this._almacen);

  static const String _claveToken = 'sigo_ollas_jwt';

  final PersistenciaSesion _almacen;

  Future<void> guardarToken(String token) {
    return _almacen.escribir(clave: _claveToken, valor: token);
  }

  Future<String?> obtenerToken() {
    return _almacen.leer(clave: _claveToken);
  }

  Future<bool> tieneSesion() async {
    final String? token = await obtenerToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> cerrarSesion() {
    return _almacen.eliminar(clave: _claveToken);
  }
}
