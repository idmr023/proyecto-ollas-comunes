import 'package:freezed_annotation/freezed_annotation.dart';
import '../domain/resultado_preparacion.dart';

part 'estado_calculo.freezed.dart';

/// Estado de UI del cálculo de preparación.
@freezed
class EstadoCalculo with _$EstadoCalculo {
  const factory EstadoCalculo.inicial() = CalculoInicial;
  const factory EstadoCalculo.calculando() = CalculoCalculando;
  const factory EstadoCalculo.exito(ResultadoPreparacion resultado) = CalculoExito;
  const factory EstadoCalculo.error(String mensaje) = CalculoError;
}
