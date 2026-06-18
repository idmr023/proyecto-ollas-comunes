import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entidades/beneficiario.dart';

part 'estado_padron.freezed.dart';

/// Estado de UI de la lista del padrón de beneficiarios.
@freezed
class EstadoPadron with _$EstadoPadron {
  const factory EstadoPadron.inicial() = PadronInicial;
  const factory EstadoPadron.cargando() = PadronCargando;
  const factory EstadoPadron.exito(List<Beneficiario> beneficiarios) = PadronExito;
  const factory EstadoPadron.error(String mensaje) = PadronError;
}
