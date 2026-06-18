import '../errores/excepciones.dart';

/// Resultado de una operación que puede fallar, sin lanzar excepciones a la UI.
/// Se modela con clases selladas nativas de Dart 3 (pattern matching con switch).
sealed class Resultado<T> {
  const Resultado();

  /// Crea un resultado exitoso con [valor].
  const factory Resultado.exito(T valor) = Exito<T>;

  /// Crea un resultado fallido con [excepcion].
  const factory Resultado.fallo(ExcepcionApp excepcion) = Fallo<T>;

  /// Indica si el resultado fue exitoso.
  bool get esExito => this is Exito<T>;
}

final class Exito<T> extends Resultado<T> {
  const Exito(this.valor);

  final T valor;
}

final class Fallo<T> extends Resultado<T> {
  const Fallo(this.excepcion);

  final ExcepcionApp excepcion;
}
