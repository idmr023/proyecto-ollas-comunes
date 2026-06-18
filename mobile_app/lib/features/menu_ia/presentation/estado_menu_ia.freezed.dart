// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'estado_menu_ia.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$EstadoMenuIa {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<SugerenciaMenu> sugerencias) exito,
    required TResult Function(String mensaje) error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<SugerenciaMenu> sugerencias)? exito,
    TResult? Function(String mensaje)? error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<SugerenciaMenu> sugerencias)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(MenuIaInicial value) inicial,
    required TResult Function(MenuIaCargando value) cargando,
    required TResult Function(MenuIaExito value) exito,
    required TResult Function(MenuIaError value) error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(MenuIaInicial value)? inicial,
    TResult? Function(MenuIaCargando value)? cargando,
    TResult? Function(MenuIaExito value)? exito,
    TResult? Function(MenuIaError value)? error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(MenuIaInicial value)? inicial,
    TResult Function(MenuIaCargando value)? cargando,
    TResult Function(MenuIaExito value)? exito,
    TResult Function(MenuIaError value)? error,
    required TResult orElse(),
  }) => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EstadoMenuIaCopyWith<$Res> {
  factory $EstadoMenuIaCopyWith(
    EstadoMenuIa value,
    $Res Function(EstadoMenuIa) then,
  ) = _$EstadoMenuIaCopyWithImpl<$Res, EstadoMenuIa>;
}

/// @nodoc
class _$EstadoMenuIaCopyWithImpl<$Res, $Val extends EstadoMenuIa>
    implements $EstadoMenuIaCopyWith<$Res> {
  _$EstadoMenuIaCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EstadoMenuIa
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc
abstract class _$$MenuIaInicialImplCopyWith<$Res> {
  factory _$$MenuIaInicialImplCopyWith(
    _$MenuIaInicialImpl value,
    $Res Function(_$MenuIaInicialImpl) then,
  ) = __$$MenuIaInicialImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$MenuIaInicialImplCopyWithImpl<$Res>
    extends _$EstadoMenuIaCopyWithImpl<$Res, _$MenuIaInicialImpl>
    implements _$$MenuIaInicialImplCopyWith<$Res> {
  __$$MenuIaInicialImplCopyWithImpl(
    _$MenuIaInicialImpl _value,
    $Res Function(_$MenuIaInicialImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoMenuIa
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$MenuIaInicialImpl implements MenuIaInicial {
  const _$MenuIaInicialImpl();

  @override
  String toString() {
    return 'EstadoMenuIa.inicial()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$MenuIaInicialImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<SugerenciaMenu> sugerencias) exito,
    required TResult Function(String mensaje) error,
  }) {
    return inicial();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<SugerenciaMenu> sugerencias)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return inicial?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<SugerenciaMenu> sugerencias)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) {
    if (inicial != null) {
      return inicial();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(MenuIaInicial value) inicial,
    required TResult Function(MenuIaCargando value) cargando,
    required TResult Function(MenuIaExito value) exito,
    required TResult Function(MenuIaError value) error,
  }) {
    return inicial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(MenuIaInicial value)? inicial,
    TResult? Function(MenuIaCargando value)? cargando,
    TResult? Function(MenuIaExito value)? exito,
    TResult? Function(MenuIaError value)? error,
  }) {
    return inicial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(MenuIaInicial value)? inicial,
    TResult Function(MenuIaCargando value)? cargando,
    TResult Function(MenuIaExito value)? exito,
    TResult Function(MenuIaError value)? error,
    required TResult orElse(),
  }) {
    if (inicial != null) {
      return inicial(this);
    }
    return orElse();
  }
}

abstract class MenuIaInicial implements EstadoMenuIa {
  const factory MenuIaInicial() = _$MenuIaInicialImpl;
}

/// @nodoc
abstract class _$$MenuIaCargandoImplCopyWith<$Res> {
  factory _$$MenuIaCargandoImplCopyWith(
    _$MenuIaCargandoImpl value,
    $Res Function(_$MenuIaCargandoImpl) then,
  ) = __$$MenuIaCargandoImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$MenuIaCargandoImplCopyWithImpl<$Res>
    extends _$EstadoMenuIaCopyWithImpl<$Res, _$MenuIaCargandoImpl>
    implements _$$MenuIaCargandoImplCopyWith<$Res> {
  __$$MenuIaCargandoImplCopyWithImpl(
    _$MenuIaCargandoImpl _value,
    $Res Function(_$MenuIaCargandoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoMenuIa
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$MenuIaCargandoImpl implements MenuIaCargando {
  const _$MenuIaCargandoImpl();

  @override
  String toString() {
    return 'EstadoMenuIa.cargando()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$MenuIaCargandoImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<SugerenciaMenu> sugerencias) exito,
    required TResult Function(String mensaje) error,
  }) {
    return cargando();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<SugerenciaMenu> sugerencias)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return cargando?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<SugerenciaMenu> sugerencias)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) {
    if (cargando != null) {
      return cargando();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(MenuIaInicial value) inicial,
    required TResult Function(MenuIaCargando value) cargando,
    required TResult Function(MenuIaExito value) exito,
    required TResult Function(MenuIaError value) error,
  }) {
    return cargando(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(MenuIaInicial value)? inicial,
    TResult? Function(MenuIaCargando value)? cargando,
    TResult? Function(MenuIaExito value)? exito,
    TResult? Function(MenuIaError value)? error,
  }) {
    return cargando?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(MenuIaInicial value)? inicial,
    TResult Function(MenuIaCargando value)? cargando,
    TResult Function(MenuIaExito value)? exito,
    TResult Function(MenuIaError value)? error,
    required TResult orElse(),
  }) {
    if (cargando != null) {
      return cargando(this);
    }
    return orElse();
  }
}

abstract class MenuIaCargando implements EstadoMenuIa {
  const factory MenuIaCargando() = _$MenuIaCargandoImpl;
}

/// @nodoc
abstract class _$$MenuIaExitoImplCopyWith<$Res> {
  factory _$$MenuIaExitoImplCopyWith(
    _$MenuIaExitoImpl value,
    $Res Function(_$MenuIaExitoImpl) then,
  ) = __$$MenuIaExitoImplCopyWithImpl<$Res>;
  @useResult
  $Res call({List<SugerenciaMenu> sugerencias});
}

/// @nodoc
class __$$MenuIaExitoImplCopyWithImpl<$Res>
    extends _$EstadoMenuIaCopyWithImpl<$Res, _$MenuIaExitoImpl>
    implements _$$MenuIaExitoImplCopyWith<$Res> {
  __$$MenuIaExitoImplCopyWithImpl(
    _$MenuIaExitoImpl _value,
    $Res Function(_$MenuIaExitoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoMenuIa
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? sugerencias = null}) {
    return _then(
      _$MenuIaExitoImpl(
        null == sugerencias
            ? _value._sugerencias
            : sugerencias // ignore: cast_nullable_to_non_nullable
                  as List<SugerenciaMenu>,
      ),
    );
  }
}

/// @nodoc

class _$MenuIaExitoImpl implements MenuIaExito {
  const _$MenuIaExitoImpl(final List<SugerenciaMenu> sugerencias)
    : _sugerencias = sugerencias;

  final List<SugerenciaMenu> _sugerencias;
  @override
  List<SugerenciaMenu> get sugerencias {
    if (_sugerencias is EqualUnmodifiableListView) return _sugerencias;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_sugerencias);
  }

  @override
  String toString() {
    return 'EstadoMenuIa.exito(sugerencias: $sugerencias)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MenuIaExitoImpl &&
            const DeepCollectionEquality().equals(
              other._sugerencias,
              _sugerencias,
            ));
  }

  @override
  int get hashCode => Object.hash(
    runtimeType,
    const DeepCollectionEquality().hash(_sugerencias),
  );

  /// Create a copy of EstadoMenuIa
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MenuIaExitoImplCopyWith<_$MenuIaExitoImpl> get copyWith =>
      __$$MenuIaExitoImplCopyWithImpl<_$MenuIaExitoImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<SugerenciaMenu> sugerencias) exito,
    required TResult Function(String mensaje) error,
  }) {
    return exito(sugerencias);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<SugerenciaMenu> sugerencias)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return exito?.call(sugerencias);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<SugerenciaMenu> sugerencias)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) {
    if (exito != null) {
      return exito(sugerencias);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(MenuIaInicial value) inicial,
    required TResult Function(MenuIaCargando value) cargando,
    required TResult Function(MenuIaExito value) exito,
    required TResult Function(MenuIaError value) error,
  }) {
    return exito(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(MenuIaInicial value)? inicial,
    TResult? Function(MenuIaCargando value)? cargando,
    TResult? Function(MenuIaExito value)? exito,
    TResult? Function(MenuIaError value)? error,
  }) {
    return exito?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(MenuIaInicial value)? inicial,
    TResult Function(MenuIaCargando value)? cargando,
    TResult Function(MenuIaExito value)? exito,
    TResult Function(MenuIaError value)? error,
    required TResult orElse(),
  }) {
    if (exito != null) {
      return exito(this);
    }
    return orElse();
  }
}

abstract class MenuIaExito implements EstadoMenuIa {
  const factory MenuIaExito(final List<SugerenciaMenu> sugerencias) =
      _$MenuIaExitoImpl;

  List<SugerenciaMenu> get sugerencias;

  /// Create a copy of EstadoMenuIa
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MenuIaExitoImplCopyWith<_$MenuIaExitoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$MenuIaErrorImplCopyWith<$Res> {
  factory _$$MenuIaErrorImplCopyWith(
    _$MenuIaErrorImpl value,
    $Res Function(_$MenuIaErrorImpl) then,
  ) = __$$MenuIaErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String mensaje});
}

/// @nodoc
class __$$MenuIaErrorImplCopyWithImpl<$Res>
    extends _$EstadoMenuIaCopyWithImpl<$Res, _$MenuIaErrorImpl>
    implements _$$MenuIaErrorImplCopyWith<$Res> {
  __$$MenuIaErrorImplCopyWithImpl(
    _$MenuIaErrorImpl _value,
    $Res Function(_$MenuIaErrorImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoMenuIa
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? mensaje = null}) {
    return _then(
      _$MenuIaErrorImpl(
        null == mensaje
            ? _value.mensaje
            : mensaje // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc

class _$MenuIaErrorImpl implements MenuIaError {
  const _$MenuIaErrorImpl(this.mensaje);

  @override
  final String mensaje;

  @override
  String toString() {
    return 'EstadoMenuIa.error(mensaje: $mensaje)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MenuIaErrorImpl &&
            (identical(other.mensaje, mensaje) || other.mensaje == mensaje));
  }

  @override
  int get hashCode => Object.hash(runtimeType, mensaje);

  /// Create a copy of EstadoMenuIa
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MenuIaErrorImplCopyWith<_$MenuIaErrorImpl> get copyWith =>
      __$$MenuIaErrorImplCopyWithImpl<_$MenuIaErrorImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<SugerenciaMenu> sugerencias) exito,
    required TResult Function(String mensaje) error,
  }) {
    return error(mensaje);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<SugerenciaMenu> sugerencias)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return error?.call(mensaje);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<SugerenciaMenu> sugerencias)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(mensaje);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(MenuIaInicial value) inicial,
    required TResult Function(MenuIaCargando value) cargando,
    required TResult Function(MenuIaExito value) exito,
    required TResult Function(MenuIaError value) error,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(MenuIaInicial value)? inicial,
    TResult? Function(MenuIaCargando value)? cargando,
    TResult? Function(MenuIaExito value)? exito,
    TResult? Function(MenuIaError value)? error,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(MenuIaInicial value)? inicial,
    TResult Function(MenuIaCargando value)? cargando,
    TResult Function(MenuIaExito value)? exito,
    TResult Function(MenuIaError value)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class MenuIaError implements EstadoMenuIa {
  const factory MenuIaError(final String mensaje) = _$MenuIaErrorImpl;

  String get mensaje;

  /// Create a copy of EstadoMenuIa
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MenuIaErrorImplCopyWith<_$MenuIaErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
