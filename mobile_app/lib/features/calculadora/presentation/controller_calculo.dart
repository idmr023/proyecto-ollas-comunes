import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../core/red/resultado.dart';
import '../domain/repositorio_calculadora.dart';
import '../domain/resultado_preparacion.dart';
import 'estado_calculo.dart';

/// Controller del cálculo de preparación.
class ControllerCalculo extends Notifier<EstadoCalculo> {
  late final RepositorioCalculadora _repositorio;

  @override
  EstadoCalculo build() {
    _repositorio = sl<RepositorioCalculadora>();
    return const EstadoCalculo.inicial();
  }

  Future<void> calcular({required String recetaId, int? personas}) async {
    state = const EstadoCalculo.calculando();
    final Resultado<ResultadoPreparacion> resultado = await _repositorio.calcular(
      recetaId: recetaId,
      personas: personas,
    );
    state = switch (resultado) {
      Exito<ResultadoPreparacion>(:final ResultadoPreparacion valor) => EstadoCalculo.exito(valor),
      Fallo<ResultadoPreparacion>(:final excepcion) => EstadoCalculo.error(excepcion.mensaje),
    };
  }

  void reiniciar() {
    state = const EstadoCalculo.inicial();
  }
}

final NotifierProvider<ControllerCalculo, EstadoCalculo> controllerCalculoProvider =
    NotifierProvider<ControllerCalculo, EstadoCalculo>(ControllerCalculo.new);
