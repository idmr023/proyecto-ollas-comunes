import 'package:freezed_annotation/freezed_annotation.dart';
import '../domain/receta_resumen.dart';

part 'estado_recetas.freezed.dart';

/// Estado de UI del selector de recetas de la calculadora.
@freezed
class EstadoRecetas with _$EstadoRecetas {
  const factory EstadoRecetas.cargando() = RecetasCargando;
  const factory EstadoRecetas.exito(List<RecetaResumen> recetas) = RecetasExito;
  const factory EstadoRecetas.error(String mensaje) = RecetasError;
}
