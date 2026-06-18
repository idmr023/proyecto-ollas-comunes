// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'estado_login.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$EstadoLogin {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(ResultadoLogin resultado) exito,
    required TResult Function(String mensaje) error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(ResultadoLogin resultado)? exito,
    TResult? Function(String mensaje)? error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(ResultadoLogin resultado)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(LoginInicial value) inicial,
    required TResult Function(LoginCargando value) cargando,
    required TResult Function(LoginExito value) exito,
    required TResult Function(LoginError value) error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(LoginInicial value)? inicial,
    TResult? Function(LoginCargando value)? cargando,
    TResult? Function(LoginExito value)? exito,
    TResult? Function(LoginError value)? error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(LoginInicial value)? inicial,
    TResult Function(LoginCargando value)? cargando,
    TResult Function(LoginExito value)? exito,
    TResult Function(LoginError value)? error,
    required TResult orElse(),
  }) => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EstadoLoginCopyWith<$Res> {
  factory $EstadoLoginCopyWith(
    EstadoLogin value,
    $Res Function(EstadoLogin) then,
  ) = _$EstadoLoginCopyWithImpl<$Res, EstadoLogin>;
}

/// @nodoc
class _$EstadoLoginCopyWithImpl<$Res, $Val extends EstadoLogin>
    implements $EstadoLoginCopyWith<$Res> {
  _$EstadoLoginCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EstadoLogin
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc
abstract class _$$LoginInicialImplCopyWith<$Res> {
  factory _$$LoginInicialImplCopyWith(
    _$LoginInicialImpl value,
    $Res Function(_$LoginInicialImpl) then,
  ) = __$$LoginInicialImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$LoginInicialImplCopyWithImpl<$Res>
    extends _$EstadoLoginCopyWithImpl<$Res, _$LoginInicialImpl>
    implements _$$LoginInicialImplCopyWith<$Res> {
  __$$LoginInicialImplCopyWithImpl(
    _$LoginInicialImpl _value,
    $Res Function(_$LoginInicialImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoLogin
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$LoginInicialImpl implements LoginInicial {
  const _$LoginInicialImpl();

  @override
  String toString() {
    return 'EstadoLogin.inicial()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$LoginInicialImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(ResultadoLogin resultado) exito,
    required TResult Function(String mensaje) error,
  }) {
    return inicial();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(ResultadoLogin resultado)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return inicial?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(ResultadoLogin resultado)? exito,
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
    required TResult Function(LoginInicial value) inicial,
    required TResult Function(LoginCargando value) cargando,
    required TResult Function(LoginExito value) exito,
    required TResult Function(LoginError value) error,
  }) {
    return inicial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(LoginInicial value)? inicial,
    TResult? Function(LoginCargando value)? cargando,
    TResult? Function(LoginExito value)? exito,
    TResult? Function(LoginError value)? error,
  }) {
    return inicial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(LoginInicial value)? inicial,
    TResult Function(LoginCargando value)? cargando,
    TResult Function(LoginExito value)? exito,
    TResult Function(LoginError value)? error,
    required TResult orElse(),
  }) {
    if (inicial != null) {
      return inicial(this);
    }
    return orElse();
  }
}

abstract class LoginInicial implements EstadoLogin {
  const factory LoginInicial() = _$LoginInicialImpl;
}

/// @nodoc
abstract class _$$LoginCargandoImplCopyWith<$Res> {
  factory _$$LoginCargandoImplCopyWith(
    _$LoginCargandoImpl value,
    $Res Function(_$LoginCargandoImpl) then,
  ) = __$$LoginCargandoImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$LoginCargandoImplCopyWithImpl<$Res>
    extends _$EstadoLoginCopyWithImpl<$Res, _$LoginCargandoImpl>
    implements _$$LoginCargandoImplCopyWith<$Res> {
  __$$LoginCargandoImplCopyWithImpl(
    _$LoginCargandoImpl _value,
    $Res Function(_$LoginCargandoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoLogin
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$LoginCargandoImpl implements LoginCargando {
  const _$LoginCargandoImpl();

  @override
  String toString() {
    return 'EstadoLogin.cargando()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$LoginCargandoImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(ResultadoLogin resultado) exito,
    required TResult Function(String mensaje) error,
  }) {
    return cargando();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(ResultadoLogin resultado)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return cargando?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(ResultadoLogin resultado)? exito,
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
    required TResult Function(LoginInicial value) inicial,
    required TResult Function(LoginCargando value) cargando,
    required TResult Function(LoginExito value) exito,
    required TResult Function(LoginError value) error,
  }) {
    return cargando(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(LoginInicial value)? inicial,
    TResult? Function(LoginCargando value)? cargando,
    TResult? Function(LoginExito value)? exito,
    TResult? Function(LoginError value)? error,
  }) {
    return cargando?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(LoginInicial value)? inicial,
    TResult Function(LoginCargando value)? cargando,
    TResult Function(LoginExito value)? exito,
    TResult Function(LoginError value)? error,
    required TResult orElse(),
  }) {
    if (cargando != null) {
      return cargando(this);
    }
    return orElse();
  }
}

abstract class LoginCargando implements EstadoLogin {
  const factory LoginCargando() = _$LoginCargandoImpl;
}

/// @nodoc
abstract class _$$LoginExitoImplCopyWith<$Res> {
  factory _$$LoginExitoImplCopyWith(
    _$LoginExitoImpl value,
    $Res Function(_$LoginExitoImpl) then,
  ) = __$$LoginExitoImplCopyWithImpl<$Res>;
  @useResult
  $Res call({ResultadoLogin resultado});
}

/// @nodoc
class __$$LoginExitoImplCopyWithImpl<$Res>
    extends _$EstadoLoginCopyWithImpl<$Res, _$LoginExitoImpl>
    implements _$$LoginExitoImplCopyWith<$Res> {
  __$$LoginExitoImplCopyWithImpl(
    _$LoginExitoImpl _value,
    $Res Function(_$LoginExitoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoLogin
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? resultado = null}) {
    return _then(
      _$LoginExitoImpl(
        null == resultado
            ? _value.resultado
            : resultado // ignore: cast_nullable_to_non_nullable
                  as ResultadoLogin,
      ),
    );
  }
}

/// @nodoc

class _$LoginExitoImpl implements LoginExito {
  const _$LoginExitoImpl(this.resultado);

  @override
  final ResultadoLogin resultado;

  @override
  String toString() {
    return 'EstadoLogin.exito(resultado: $resultado)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LoginExitoImpl &&
            (identical(other.resultado, resultado) ||
                other.resultado == resultado));
  }

  @override
  int get hashCode => Object.hash(runtimeType, resultado);

  /// Create a copy of EstadoLogin
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$LoginExitoImplCopyWith<_$LoginExitoImpl> get copyWith =>
      __$$LoginExitoImplCopyWithImpl<_$LoginExitoImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(ResultadoLogin resultado) exito,
    required TResult Function(String mensaje) error,
  }) {
    return exito(resultado);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(ResultadoLogin resultado)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return exito?.call(resultado);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(ResultadoLogin resultado)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) {
    if (exito != null) {
      return exito(resultado);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(LoginInicial value) inicial,
    required TResult Function(LoginCargando value) cargando,
    required TResult Function(LoginExito value) exito,
    required TResult Function(LoginError value) error,
  }) {
    return exito(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(LoginInicial value)? inicial,
    TResult? Function(LoginCargando value)? cargando,
    TResult? Function(LoginExito value)? exito,
    TResult? Function(LoginError value)? error,
  }) {
    return exito?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(LoginInicial value)? inicial,
    TResult Function(LoginCargando value)? cargando,
    TResult Function(LoginExito value)? exito,
    TResult Function(LoginError value)? error,
    required TResult orElse(),
  }) {
    if (exito != null) {
      return exito(this);
    }
    return orElse();
  }
}

abstract class LoginExito implements EstadoLogin {
  const factory LoginExito(final ResultadoLogin resultado) = _$LoginExitoImpl;

  ResultadoLogin get resultado;

  /// Create a copy of EstadoLogin
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$LoginExitoImplCopyWith<_$LoginExitoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$LoginErrorImplCopyWith<$Res> {
  factory _$$LoginErrorImplCopyWith(
    _$LoginErrorImpl value,
    $Res Function(_$LoginErrorImpl) then,
  ) = __$$LoginErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String mensaje});
}

/// @nodoc
class __$$LoginErrorImplCopyWithImpl<$Res>
    extends _$EstadoLoginCopyWithImpl<$Res, _$LoginErrorImpl>
    implements _$$LoginErrorImplCopyWith<$Res> {
  __$$LoginErrorImplCopyWithImpl(
    _$LoginErrorImpl _value,
    $Res Function(_$LoginErrorImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoLogin
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? mensaje = null}) {
    return _then(
      _$LoginErrorImpl(
        null == mensaje
            ? _value.mensaje
            : mensaje // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc

class _$LoginErrorImpl implements LoginError {
  const _$LoginErrorImpl(this.mensaje);

  @override
  final String mensaje;

  @override
  String toString() {
    return 'EstadoLogin.error(mensaje: $mensaje)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LoginErrorImpl &&
            (identical(other.mensaje, mensaje) || other.mensaje == mensaje));
  }

  @override
  int get hashCode => Object.hash(runtimeType, mensaje);

  /// Create a copy of EstadoLogin
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$LoginErrorImplCopyWith<_$LoginErrorImpl> get copyWith =>
      __$$LoginErrorImplCopyWithImpl<_$LoginErrorImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(ResultadoLogin resultado) exito,
    required TResult Function(String mensaje) error,
  }) {
    return error(mensaje);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(ResultadoLogin resultado)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return error?.call(mensaje);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(ResultadoLogin resultado)? exito,
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
    required TResult Function(LoginInicial value) inicial,
    required TResult Function(LoginCargando value) cargando,
    required TResult Function(LoginExito value) exito,
    required TResult Function(LoginError value) error,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(LoginInicial value)? inicial,
    TResult? Function(LoginCargando value)? cargando,
    TResult? Function(LoginExito value)? exito,
    TResult? Function(LoginError value)? error,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(LoginInicial value)? inicial,
    TResult Function(LoginCargando value)? cargando,
    TResult Function(LoginExito value)? exito,
    TResult Function(LoginError value)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class LoginError implements EstadoLogin {
  const factory LoginError(final String mensaje) = _$LoginErrorImpl;

  String get mensaje;

  /// Create a copy of EstadoLogin
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$LoginErrorImplCopyWith<_$LoginErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
