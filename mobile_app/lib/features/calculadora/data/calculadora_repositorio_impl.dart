import 'package:dio/dio.dart';
import '../../../core/red/cliente_http.dart';
import '../../../core/red/resultado.dart';
import '../domain/receta_resumen.dart';
import '../domain/repositorio_calculadora.dart';
import '../domain/resultado_preparacion.dart';

/// Implementación del [RepositorioCalculadora] sobre la API REST.
class CalculadoraRepositorioImpl implements RepositorioCalculadora {
  CalculadoraRepositorioImpl(this._cliente);

  final ClienteHttp _cliente;

  @override
  Future<Resultado<List<RecetaResumen>>> listarRecetas() async {
    try {
      final Response<dynamic> respuesta = await _cliente.obtener('/mobile/recipes');
      final Map<String, dynamic> datos = Map<String, dynamic>.from(respuesta.data as Map);
      final List<dynamic> items = (datos['items'] as List<dynamic>?) ?? <dynamic>[];
      return Resultado<List<RecetaResumen>>.exito(
        items.map((dynamic e) => RecetaResumen.desdeJson(Map<String, dynamic>.from(e as Map))).toList(),
      );
    } on DioException catch (err) {
      return Resultado<List<RecetaResumen>>.fallo(ClienteHttp.traducirError(err));
    }
  }

  @override
  Future<Resultado<ResultadoPreparacion>> calcular({required String recetaId, int? personas}) async {
    try {
      final Response<dynamic> respuesta = await _cliente.publicar(
        '/mobile/preparacion/calcular',
        cuerpo: <String, dynamic>{
          'recipeId': recetaId,
          'personas': ?personas,
        },
      );
      final Map<String, dynamic> datos = Map<String, dynamic>.from(respuesta.data as Map);
      return Resultado<ResultadoPreparacion>.exito(ResultadoPreparacion.desdeJson(datos));
    } on DioException catch (err) {
      return Resultado<ResultadoPreparacion>.fallo(ClienteHttp.traducirError(err));
    }
  }
}
