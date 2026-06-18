import 'package:dio/dio.dart';
import '../../../core/red/cliente_http.dart';
import '../../../core/red/resultado.dart';
import '../domain/datos_beneficiario.dart';
import '../domain/entidades/beneficiario.dart';
import '../domain/entidades/condicion_salud.dart';
import '../domain/entidades/olla_referencia.dart';
import '../domain/repositorio_padron.dart';
import 'padron_api.dart';

/// Implementación del [RepositorioPadron] sobre la API REST de beneficiarios.
class PadronRepositorioImpl implements RepositorioPadron {
  PadronRepositorioImpl(this._api);

  final PadronApi _api;

  @override
  Future<Resultado<List<Beneficiario>>> listar({String? busqueda}) async {
    try {
      final Map<String, dynamic> datos = await _api.listar(busqueda: busqueda);
      return Resultado<List<Beneficiario>>.exito(_mapearLista(datos));
    } on DioException catch (err) {
      return Resultado<List<Beneficiario>>.fallo(ClienteHttp.traducirError(err));
    }
  }

  @override
  Future<Resultado<Beneficiario>> crear(DatosBeneficiario datos) async {
    return _enviar(() => _api.crear(datos.aJson()));
  }

  @override
  Future<Resultado<Beneficiario>> actualizar(String id, DatosBeneficiario datos) async {
    return _enviar(() => _api.actualizar(id, datos.aJson()));
  }

  @override
  Future<Resultado<void>> eliminar(String id) async {
    try {
      await _api.eliminar(id);
      return const Resultado<void>.exito(null);
    } on DioException catch (err) {
      return Resultado<void>.fallo(ClienteHttp.traducirError(err));
    }
  }

  @override
  Future<Resultado<List<CondicionSalud>>> listarCondiciones() async {
    try {
      final Map<String, dynamic> datos = await _api.listarCondiciones();
      final List<dynamic> items = (datos['items'] as List<dynamic>?) ?? <dynamic>[];
      return Resultado<List<CondicionSalud>>.exito(
        items.map((dynamic e) => CondicionSalud.desdeJson(Map<String, dynamic>.from(e as Map))).toList(),
      );
    } on DioException catch (err) {
      return Resultado<List<CondicionSalud>>.fallo(ClienteHttp.traducirError(err));
    }
  }

  @override
  Future<Resultado<List<OllaReferencia>>> listarOllas() async {
    try {
      final Map<String, dynamic> datos = await _api.listarOllas();
      final List<dynamic> items = (datos['items'] as List<dynamic>?) ?? <dynamic>[];
      return Resultado<List<OllaReferencia>>.exito(
        items.map((dynamic e) => OllaReferencia.desdeJson(Map<String, dynamic>.from(e as Map))).toList(),
      );
    } on DioException catch (err) {
      return Resultado<List<OllaReferencia>>.fallo(ClienteHttp.traducirError(err));
    }
  }

  Future<Resultado<Beneficiario>> _enviar(Future<Map<String, dynamic>> Function() accion) async {
    try {
      final Map<String, dynamic> datos = await accion();
      return Resultado<Beneficiario>.exito(
        Beneficiario.desdeJson(Map<String, dynamic>.from(datos['item'] as Map)),
      );
    } on DioException catch (err) {
      return Resultado<Beneficiario>.fallo(ClienteHttp.traducirError(err));
    }
  }

  List<Beneficiario> _mapearLista(Map<String, dynamic> datos) {
    final List<dynamic> items = (datos['items'] as List<dynamic>?) ?? <dynamic>[];
    return items.map((dynamic e) => Beneficiario.desdeJson(Map<String, dynamic>.from(e as Map))).toList();
  }
}
