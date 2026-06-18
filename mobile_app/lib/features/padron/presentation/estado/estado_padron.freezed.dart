// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'estado_padron.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$EstadoPadron {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<Beneficiario> beneficiarios) exito,
    required TResult Function(String mensaje) error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<Beneficiario> beneficiarios)? exito,
    TResult? Function(String mensaje)? error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<Beneficiario> beneficiarios)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(PadronInicial value) inicial,
    required TResult Function(PadronCargando value) cargando,
    required TResult Function(PadronExito value) exito,
    required TResult Function(PadronError value) error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(PadronInicial value)? inicial,
    TResult? Function(PadronCargando value)? cargando,
    TResult? Function(PadronExito value)? exito,
    TResult? Function(PadronError value)? error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(PadronInicial value)? inicial,
    TResult Function(PadronCargando value)? cargando,
    TResult Function(PadronExito value)? exito,
    TResult Function(PadronError value)? error,
    required TResult orElse(),
  }) => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EstadoPadronCopyWith<$Res> {
  factory $EstadoPadronCopyWith(
    EstadoPadron value,
    $Res Function(EstadoPadron) then,
  ) = _$EstadoPadronCopyWithImpl<$Res, EstadoPadron>;
}

/// @nodoc
class _$EstadoPadronCopyWithImpl<$Res, $Val extends EstadoPadron>
    implements $EstadoPadronCopyWith<$Res> {
  _$EstadoPadronCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EstadoPadron
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc
abstract class _$$PadronInicialImplCopyWith<$Res> {
  factory _$$PadronInicialImplCopyWith(
    _$PadronInicialImpl value,
    $Res Function(_$PadronInicialImpl) then,
  ) = __$$PadronInicialImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$PadronInicialImplCopyWithImpl<$Res>
    extends _$EstadoPadronCopyWithImpl<$Res, _$PadronInicialImpl>
    implements _$$PadronInicialImplCopyWith<$Res> {
  __$$PadronInicialImplCopyWithImpl(
    _$PadronInicialImpl _value,
    $Res Function(_$PadronInicialImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoPadron
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$PadronInicialImpl implements PadronInicial {
  const _$PadronInicialImpl();

  @override
  String toString() {
    return 'EstadoPadron.inicial()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$PadronInicialImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<Beneficiario> beneficiarios) exito,
    required TResult Function(String mensaje) error,
  }) {
    return inicial();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<Beneficiario> beneficiarios)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return inicial?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<Beneficiario> beneficiarios)? exito,
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
    required TResult Function(PadronInicial value) inicial,
    required TResult Function(PadronCargando value) cargando,
    required TResult Function(PadronExito value) exito,
    required TResult Function(PadronError value) error,
  }) {
    return inicial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(PadronInicial value)? inicial,
    TResult? Function(PadronCargando value)? cargando,
    TResult? Function(PadronExito value)? exito,
    TResult? Function(PadronError value)? error,
  }) {
    return inicial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(PadronInicial value)? inicial,
    TResult Function(PadronCargando value)? cargando,
    TResult Function(PadronExito value)? exito,
    TResult Function(PadronError value)? error,
    required TResult orElse(),
  }) {
    if (inicial != null) {
      return inicial(this);
    }
    return orElse();
  }
}

abstract class PadronInicial implements EstadoPadron {
  const factory PadronInicial() = _$PadronInicialImpl;
}

/// @nodoc
abstract class _$$PadronCargandoImplCopyWith<$Res> {
  factory _$$PadronCargandoImplCopyWith(
    _$PadronCargandoImpl value,
    $Res Function(_$PadronCargandoImpl) then,
  ) = __$$PadronCargandoImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$PadronCargandoImplCopyWithImpl<$Res>
    extends _$EstadoPadronCopyWithImpl<$Res, _$PadronCargandoImpl>
    implements _$$PadronCargandoImplCopyWith<$Res> {
  __$$PadronCargandoImplCopyWithImpl(
    _$PadronCargandoImpl _value,
    $Res Function(_$PadronCargandoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoPadron
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$PadronCargandoImpl implements PadronCargando {
  const _$PadronCargandoImpl();

  @override
  String toString() {
    return 'EstadoPadron.cargando()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$PadronCargandoImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<Beneficiario> beneficiarios) exito,
    required TResult Function(String mensaje) error,
  }) {
    return cargando();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<Beneficiario> beneficiarios)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return cargando?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<Beneficiario> beneficiarios)? exito,
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
    required TResult Function(PadronInicial value) inicial,
    required TResult Function(PadronCargando value) cargando,
    required TResult Function(PadronExito value) exito,
    required TResult Function(PadronError value) error,
  }) {
    return cargando(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(PadronInicial value)? inicial,
    TResult? Function(PadronCargando value)? cargando,
    TResult? Function(PadronExito value)? exito,
    TResult? Function(PadronError value)? error,
  }) {
    return cargando?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(PadronInicial value)? inicial,
    TResult Function(PadronCargando value)? cargando,
    TResult Function(PadronExito value)? exito,
    TResult Function(PadronError value)? error,
    required TResult orElse(),
  }) {
    if (cargando != null) {
      return cargando(this);
    }
    return orElse();
  }
}

abstract class PadronCargando implements EstadoPadron {
  const factory PadronCargando() = _$PadronCargandoImpl;
}

/// @nodoc
abstract class _$$PadronExitoImplCopyWith<$Res> {
  factory _$$PadronExitoImplCopyWith(
    _$PadronExitoImpl value,
    $Res Function(_$PadronExitoImpl) then,
  ) = __$$PadronExitoImplCopyWithImpl<$Res>;
  @useResult
  $Res call({List<Beneficiario> beneficiarios});
}

/// @nodoc
class __$$PadronExitoImplCopyWithImpl<$Res>
    extends _$EstadoPadronCopyWithImpl<$Res, _$PadronExitoImpl>
    implements _$$PadronExitoImplCopyWith<$Res> {
  __$$PadronExitoImplCopyWithImpl(
    _$PadronExitoImpl _value,
    $Res Function(_$PadronExitoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoPadron
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? beneficiarios = null}) {
    return _then(
      _$PadronExitoImpl(
        null == beneficiarios
            ? _value._beneficiarios
            : beneficiarios // ignore: cast_nullable_to_non_nullable
                  as List<Beneficiario>,
      ),
    );
  }
}

/// @nodoc

class _$PadronExitoImpl implements PadronExito {
  const _$PadronExitoImpl(final List<Beneficiario> beneficiarios)
    : _beneficiarios = beneficiarios;

  final List<Beneficiario> _beneficiarios;
  @override
  List<Beneficiario> get beneficiarios {
    if (_beneficiarios is EqualUnmodifiableListView) return _beneficiarios;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_beneficiarios);
  }

  @override
  String toString() {
    return 'EstadoPadron.exito(beneficiarios: $beneficiarios)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PadronExitoImpl &&
            const DeepCollectionEquality().equals(
              other._beneficiarios,
              _beneficiarios,
            ));
  }

  @override
  int get hashCode => Object.hash(
    runtimeType,
    const DeepCollectionEquality().hash(_beneficiarios),
  );

  /// Create a copy of EstadoPadron
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PadronExitoImplCopyWith<_$PadronExitoImpl> get copyWith =>
      __$$PadronExitoImplCopyWithImpl<_$PadronExitoImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<Beneficiario> beneficiarios) exito,
    required TResult Function(String mensaje) error,
  }) {
    return exito(beneficiarios);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<Beneficiario> beneficiarios)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return exito?.call(beneficiarios);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<Beneficiario> beneficiarios)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) {
    if (exito != null) {
      return exito(beneficiarios);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(PadronInicial value) inicial,
    required TResult Function(PadronCargando value) cargando,
    required TResult Function(PadronExito value) exito,
    required TResult Function(PadronError value) error,
  }) {
    return exito(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(PadronInicial value)? inicial,
    TResult? Function(PadronCargando value)? cargando,
    TResult? Function(PadronExito value)? exito,
    TResult? Function(PadronError value)? error,
  }) {
    return exito?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(PadronInicial value)? inicial,
    TResult Function(PadronCargando value)? cargando,
    TResult Function(PadronExito value)? exito,
    TResult Function(PadronError value)? error,
    required TResult orElse(),
  }) {
    if (exito != null) {
      return exito(this);
    }
    return orElse();
  }
}

abstract class PadronExito implements EstadoPadron {
  const factory PadronExito(final List<Beneficiario> beneficiarios) =
      _$PadronExitoImpl;

  List<Beneficiario> get beneficiarios;

  /// Create a copy of EstadoPadron
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PadronExitoImplCopyWith<_$PadronExitoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$PadronErrorImplCopyWith<$Res> {
  factory _$$PadronErrorImplCopyWith(
    _$PadronErrorImpl value,
    $Res Function(_$PadronErrorImpl) then,
  ) = __$$PadronErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String mensaje});
}

/// @nodoc
class __$$PadronErrorImplCopyWithImpl<$Res>
    extends _$EstadoPadronCopyWithImpl<$Res, _$PadronErrorImpl>
    implements _$$PadronErrorImplCopyWith<$Res> {
  __$$PadronErrorImplCopyWithImpl(
    _$PadronErrorImpl _value,
    $Res Function(_$PadronErrorImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoPadron
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? mensaje = null}) {
    return _then(
      _$PadronErrorImpl(
        null == mensaje
            ? _value.mensaje
            : mensaje // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc

class _$PadronErrorImpl implements PadronError {
  const _$PadronErrorImpl(this.mensaje);

  @override
  final String mensaje;

  @override
  String toString() {
    return 'EstadoPadron.error(mensaje: $mensaje)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PadronErrorImpl &&
            (identical(other.mensaje, mensaje) || other.mensaje == mensaje));
  }

  @override
  int get hashCode => Object.hash(runtimeType, mensaje);

  /// Create a copy of EstadoPadron
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PadronErrorImplCopyWith<_$PadronErrorImpl> get copyWith =>
      __$$PadronErrorImplCopyWithImpl<_$PadronErrorImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<Beneficiario> beneficiarios) exito,
    required TResult Function(String mensaje) error,
  }) {
    return error(mensaje);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<Beneficiario> beneficiarios)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return error?.call(mensaje);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<Beneficiario> beneficiarios)? exito,
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
    required TResult Function(PadronInicial value) inicial,
    required TResult Function(PadronCargando value) cargando,
    required TResult Function(PadronExito value) exito,
    required TResult Function(PadronError value) error,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(PadronInicial value)? inicial,
    TResult? Function(PadronCargando value)? cargando,
    TResult? Function(PadronExito value)? exito,
    TResult? Function(PadronError value)? error,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(PadronInicial value)? inicial,
    TResult Function(PadronCargando value)? cargando,
    TResult Function(PadronExito value)? exito,
    TResult Function(PadronError value)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class PadronError implements EstadoPadron {
  const factory PadronError(final String mensaje) = _$PadronErrorImpl;

  String get mensaje;

  /// Create a copy of EstadoPadron
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PadronErrorImplCopyWith<_$PadronErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
