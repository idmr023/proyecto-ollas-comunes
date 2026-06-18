// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'estado_verificacion.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$EstadoVerificacion {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(Usuario usuario) exito,
    required TResult Function(String mensaje) error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(Usuario usuario)? exito,
    TResult? Function(String mensaje)? error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(Usuario usuario)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(VerificacionInicial value) inicial,
    required TResult Function(VerificacionCargando value) cargando,
    required TResult Function(VerificacionExito value) exito,
    required TResult Function(VerificacionError value) error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(VerificacionInicial value)? inicial,
    TResult? Function(VerificacionCargando value)? cargando,
    TResult? Function(VerificacionExito value)? exito,
    TResult? Function(VerificacionError value)? error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(VerificacionInicial value)? inicial,
    TResult Function(VerificacionCargando value)? cargando,
    TResult Function(VerificacionExito value)? exito,
    TResult Function(VerificacionError value)? error,
    required TResult orElse(),
  }) => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EstadoVerificacionCopyWith<$Res> {
  factory $EstadoVerificacionCopyWith(
    EstadoVerificacion value,
    $Res Function(EstadoVerificacion) then,
  ) = _$EstadoVerificacionCopyWithImpl<$Res, EstadoVerificacion>;
}

/// @nodoc
class _$EstadoVerificacionCopyWithImpl<$Res, $Val extends EstadoVerificacion>
    implements $EstadoVerificacionCopyWith<$Res> {
  _$EstadoVerificacionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EstadoVerificacion
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc
abstract class _$$VerificacionInicialImplCopyWith<$Res> {
  factory _$$VerificacionInicialImplCopyWith(
    _$VerificacionInicialImpl value,
    $Res Function(_$VerificacionInicialImpl) then,
  ) = __$$VerificacionInicialImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$VerificacionInicialImplCopyWithImpl<$Res>
    extends _$EstadoVerificacionCopyWithImpl<$Res, _$VerificacionInicialImpl>
    implements _$$VerificacionInicialImplCopyWith<$Res> {
  __$$VerificacionInicialImplCopyWithImpl(
    _$VerificacionInicialImpl _value,
    $Res Function(_$VerificacionInicialImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoVerificacion
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$VerificacionInicialImpl implements VerificacionInicial {
  const _$VerificacionInicialImpl();

  @override
  String toString() {
    return 'EstadoVerificacion.inicial()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$VerificacionInicialImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(Usuario usuario) exito,
    required TResult Function(String mensaje) error,
  }) {
    return inicial();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(Usuario usuario)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return inicial?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(Usuario usuario)? exito,
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
    required TResult Function(VerificacionInicial value) inicial,
    required TResult Function(VerificacionCargando value) cargando,
    required TResult Function(VerificacionExito value) exito,
    required TResult Function(VerificacionError value) error,
  }) {
    return inicial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(VerificacionInicial value)? inicial,
    TResult? Function(VerificacionCargando value)? cargando,
    TResult? Function(VerificacionExito value)? exito,
    TResult? Function(VerificacionError value)? error,
  }) {
    return inicial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(VerificacionInicial value)? inicial,
    TResult Function(VerificacionCargando value)? cargando,
    TResult Function(VerificacionExito value)? exito,
    TResult Function(VerificacionError value)? error,
    required TResult orElse(),
  }) {
    if (inicial != null) {
      return inicial(this);
    }
    return orElse();
  }
}

abstract class VerificacionInicial implements EstadoVerificacion {
  const factory VerificacionInicial() = _$VerificacionInicialImpl;
}

/// @nodoc
abstract class _$$VerificacionCargandoImplCopyWith<$Res> {
  factory _$$VerificacionCargandoImplCopyWith(
    _$VerificacionCargandoImpl value,
    $Res Function(_$VerificacionCargandoImpl) then,
  ) = __$$VerificacionCargandoImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$VerificacionCargandoImplCopyWithImpl<$Res>
    extends _$EstadoVerificacionCopyWithImpl<$Res, _$VerificacionCargandoImpl>
    implements _$$VerificacionCargandoImplCopyWith<$Res> {
  __$$VerificacionCargandoImplCopyWithImpl(
    _$VerificacionCargandoImpl _value,
    $Res Function(_$VerificacionCargandoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoVerificacion
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$VerificacionCargandoImpl implements VerificacionCargando {
  const _$VerificacionCargandoImpl();

  @override
  String toString() {
    return 'EstadoVerificacion.cargando()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$VerificacionCargandoImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(Usuario usuario) exito,
    required TResult Function(String mensaje) error,
  }) {
    return cargando();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(Usuario usuario)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return cargando?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(Usuario usuario)? exito,
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
    required TResult Function(VerificacionInicial value) inicial,
    required TResult Function(VerificacionCargando value) cargando,
    required TResult Function(VerificacionExito value) exito,
    required TResult Function(VerificacionError value) error,
  }) {
    return cargando(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(VerificacionInicial value)? inicial,
    TResult? Function(VerificacionCargando value)? cargando,
    TResult? Function(VerificacionExito value)? exito,
    TResult? Function(VerificacionError value)? error,
  }) {
    return cargando?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(VerificacionInicial value)? inicial,
    TResult Function(VerificacionCargando value)? cargando,
    TResult Function(VerificacionExito value)? exito,
    TResult Function(VerificacionError value)? error,
    required TResult orElse(),
  }) {
    if (cargando != null) {
      return cargando(this);
    }
    return orElse();
  }
}

abstract class VerificacionCargando implements EstadoVerificacion {
  const factory VerificacionCargando() = _$VerificacionCargandoImpl;
}

/// @nodoc
abstract class _$$VerificacionExitoImplCopyWith<$Res> {
  factory _$$VerificacionExitoImplCopyWith(
    _$VerificacionExitoImpl value,
    $Res Function(_$VerificacionExitoImpl) then,
  ) = __$$VerificacionExitoImplCopyWithImpl<$Res>;
  @useResult
  $Res call({Usuario usuario});
}

/// @nodoc
class __$$VerificacionExitoImplCopyWithImpl<$Res>
    extends _$EstadoVerificacionCopyWithImpl<$Res, _$VerificacionExitoImpl>
    implements _$$VerificacionExitoImplCopyWith<$Res> {
  __$$VerificacionExitoImplCopyWithImpl(
    _$VerificacionExitoImpl _value,
    $Res Function(_$VerificacionExitoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoVerificacion
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? usuario = null}) {
    return _then(
      _$VerificacionExitoImpl(
        null == usuario
            ? _value.usuario
            : usuario // ignore: cast_nullable_to_non_nullable
                  as Usuario,
      ),
    );
  }
}

/// @nodoc

class _$VerificacionExitoImpl implements VerificacionExito {
  const _$VerificacionExitoImpl(this.usuario);

  @override
  final Usuario usuario;

  @override
  String toString() {
    return 'EstadoVerificacion.exito(usuario: $usuario)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$VerificacionExitoImpl &&
            (identical(other.usuario, usuario) || other.usuario == usuario));
  }

  @override
  int get hashCode => Object.hash(runtimeType, usuario);

  /// Create a copy of EstadoVerificacion
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$VerificacionExitoImplCopyWith<_$VerificacionExitoImpl> get copyWith =>
      __$$VerificacionExitoImplCopyWithImpl<_$VerificacionExitoImpl>(
        this,
        _$identity,
      );

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(Usuario usuario) exito,
    required TResult Function(String mensaje) error,
  }) {
    return exito(usuario);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(Usuario usuario)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return exito?.call(usuario);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(Usuario usuario)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) {
    if (exito != null) {
      return exito(usuario);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(VerificacionInicial value) inicial,
    required TResult Function(VerificacionCargando value) cargando,
    required TResult Function(VerificacionExito value) exito,
    required TResult Function(VerificacionError value) error,
  }) {
    return exito(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(VerificacionInicial value)? inicial,
    TResult? Function(VerificacionCargando value)? cargando,
    TResult? Function(VerificacionExito value)? exito,
    TResult? Function(VerificacionError value)? error,
  }) {
    return exito?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(VerificacionInicial value)? inicial,
    TResult Function(VerificacionCargando value)? cargando,
    TResult Function(VerificacionExito value)? exito,
    TResult Function(VerificacionError value)? error,
    required TResult orElse(),
  }) {
    if (exito != null) {
      return exito(this);
    }
    return orElse();
  }
}

abstract class VerificacionExito implements EstadoVerificacion {
  const factory VerificacionExito(final Usuario usuario) =
      _$VerificacionExitoImpl;

  Usuario get usuario;

  /// Create a copy of EstadoVerificacion
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$VerificacionExitoImplCopyWith<_$VerificacionExitoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$VerificacionErrorImplCopyWith<$Res> {
  factory _$$VerificacionErrorImplCopyWith(
    _$VerificacionErrorImpl value,
    $Res Function(_$VerificacionErrorImpl) then,
  ) = __$$VerificacionErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String mensaje});
}

/// @nodoc
class __$$VerificacionErrorImplCopyWithImpl<$Res>
    extends _$EstadoVerificacionCopyWithImpl<$Res, _$VerificacionErrorImpl>
    implements _$$VerificacionErrorImplCopyWith<$Res> {
  __$$VerificacionErrorImplCopyWithImpl(
    _$VerificacionErrorImpl _value,
    $Res Function(_$VerificacionErrorImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoVerificacion
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? mensaje = null}) {
    return _then(
      _$VerificacionErrorImpl(
        null == mensaje
            ? _value.mensaje
            : mensaje // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc

class _$VerificacionErrorImpl implements VerificacionError {
  const _$VerificacionErrorImpl(this.mensaje);

  @override
  final String mensaje;

  @override
  String toString() {
    return 'EstadoVerificacion.error(mensaje: $mensaje)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$VerificacionErrorImpl &&
            (identical(other.mensaje, mensaje) || other.mensaje == mensaje));
  }

  @override
  int get hashCode => Object.hash(runtimeType, mensaje);

  /// Create a copy of EstadoVerificacion
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$VerificacionErrorImplCopyWith<_$VerificacionErrorImpl> get copyWith =>
      __$$VerificacionErrorImplCopyWithImpl<_$VerificacionErrorImpl>(
        this,
        _$identity,
      );

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(Usuario usuario) exito,
    required TResult Function(String mensaje) error,
  }) {
    return error(mensaje);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(Usuario usuario)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return error?.call(mensaje);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(Usuario usuario)? exito,
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
    required TResult Function(VerificacionInicial value) inicial,
    required TResult Function(VerificacionCargando value) cargando,
    required TResult Function(VerificacionExito value) exito,
    required TResult Function(VerificacionError value) error,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(VerificacionInicial value)? inicial,
    TResult? Function(VerificacionCargando value)? cargando,
    TResult? Function(VerificacionExito value)? exito,
    TResult? Function(VerificacionError value)? error,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(VerificacionInicial value)? inicial,
    TResult Function(VerificacionCargando value)? cargando,
    TResult Function(VerificacionExito value)? exito,
    TResult Function(VerificacionError value)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class VerificacionError implements EstadoVerificacion {
  const factory VerificacionError(final String mensaje) =
      _$VerificacionErrorImpl;

  String get mensaje;

  /// Create a copy of EstadoVerificacion
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$VerificacionErrorImplCopyWith<_$VerificacionErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
