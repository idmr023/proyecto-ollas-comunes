// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'estado_recetas.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$EstadoRecetas {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() cargando,
    required TResult Function(List<RecetaResumen> recetas) exito,
    required TResult Function(String mensaje) error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? cargando,
    TResult? Function(List<RecetaResumen> recetas)? exito,
    TResult? Function(String mensaje)? error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? cargando,
    TResult Function(List<RecetaResumen> recetas)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(RecetasCargando value) cargando,
    required TResult Function(RecetasExito value) exito,
    required TResult Function(RecetasError value) error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(RecetasCargando value)? cargando,
    TResult? Function(RecetasExito value)? exito,
    TResult? Function(RecetasError value)? error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(RecetasCargando value)? cargando,
    TResult Function(RecetasExito value)? exito,
    TResult Function(RecetasError value)? error,
    required TResult orElse(),
  }) => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EstadoRecetasCopyWith<$Res> {
  factory $EstadoRecetasCopyWith(
    EstadoRecetas value,
    $Res Function(EstadoRecetas) then,
  ) = _$EstadoRecetasCopyWithImpl<$Res, EstadoRecetas>;
}

/// @nodoc
class _$EstadoRecetasCopyWithImpl<$Res, $Val extends EstadoRecetas>
    implements $EstadoRecetasCopyWith<$Res> {
  _$EstadoRecetasCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EstadoRecetas
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc
abstract class _$$RecetasCargandoImplCopyWith<$Res> {
  factory _$$RecetasCargandoImplCopyWith(
    _$RecetasCargandoImpl value,
    $Res Function(_$RecetasCargandoImpl) then,
  ) = __$$RecetasCargandoImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$RecetasCargandoImplCopyWithImpl<$Res>
    extends _$EstadoRecetasCopyWithImpl<$Res, _$RecetasCargandoImpl>
    implements _$$RecetasCargandoImplCopyWith<$Res> {
  __$$RecetasCargandoImplCopyWithImpl(
    _$RecetasCargandoImpl _value,
    $Res Function(_$RecetasCargandoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoRecetas
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$RecetasCargandoImpl implements RecetasCargando {
  const _$RecetasCargandoImpl();

  @override
  String toString() {
    return 'EstadoRecetas.cargando()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$RecetasCargandoImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() cargando,
    required TResult Function(List<RecetaResumen> recetas) exito,
    required TResult Function(String mensaje) error,
  }) {
    return cargando();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? cargando,
    TResult? Function(List<RecetaResumen> recetas)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return cargando?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? cargando,
    TResult Function(List<RecetaResumen> recetas)? exito,
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
    required TResult Function(RecetasCargando value) cargando,
    required TResult Function(RecetasExito value) exito,
    required TResult Function(RecetasError value) error,
  }) {
    return cargando(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(RecetasCargando value)? cargando,
    TResult? Function(RecetasExito value)? exito,
    TResult? Function(RecetasError value)? error,
  }) {
    return cargando?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(RecetasCargando value)? cargando,
    TResult Function(RecetasExito value)? exito,
    TResult Function(RecetasError value)? error,
    required TResult orElse(),
  }) {
    if (cargando != null) {
      return cargando(this);
    }
    return orElse();
  }
}

abstract class RecetasCargando implements EstadoRecetas {
  const factory RecetasCargando() = _$RecetasCargandoImpl;
}

/// @nodoc
abstract class _$$RecetasExitoImplCopyWith<$Res> {
  factory _$$RecetasExitoImplCopyWith(
    _$RecetasExitoImpl value,
    $Res Function(_$RecetasExitoImpl) then,
  ) = __$$RecetasExitoImplCopyWithImpl<$Res>;
  @useResult
  $Res call({List<RecetaResumen> recetas});
}

/// @nodoc
class __$$RecetasExitoImplCopyWithImpl<$Res>
    extends _$EstadoRecetasCopyWithImpl<$Res, _$RecetasExitoImpl>
    implements _$$RecetasExitoImplCopyWith<$Res> {
  __$$RecetasExitoImplCopyWithImpl(
    _$RecetasExitoImpl _value,
    $Res Function(_$RecetasExitoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoRecetas
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? recetas = null}) {
    return _then(
      _$RecetasExitoImpl(
        null == recetas
            ? _value._recetas
            : recetas // ignore: cast_nullable_to_non_nullable
                  as List<RecetaResumen>,
      ),
    );
  }
}

/// @nodoc

class _$RecetasExitoImpl implements RecetasExito {
  const _$RecetasExitoImpl(final List<RecetaResumen> recetas)
    : _recetas = recetas;

  final List<RecetaResumen> _recetas;
  @override
  List<RecetaResumen> get recetas {
    if (_recetas is EqualUnmodifiableListView) return _recetas;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_recetas);
  }

  @override
  String toString() {
    return 'EstadoRecetas.exito(recetas: $recetas)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RecetasExitoImpl &&
            const DeepCollectionEquality().equals(other._recetas, _recetas));
  }

  @override
  int get hashCode =>
      Object.hash(runtimeType, const DeepCollectionEquality().hash(_recetas));

  /// Create a copy of EstadoRecetas
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RecetasExitoImplCopyWith<_$RecetasExitoImpl> get copyWith =>
      __$$RecetasExitoImplCopyWithImpl<_$RecetasExitoImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() cargando,
    required TResult Function(List<RecetaResumen> recetas) exito,
    required TResult Function(String mensaje) error,
  }) {
    return exito(recetas);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? cargando,
    TResult? Function(List<RecetaResumen> recetas)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return exito?.call(recetas);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? cargando,
    TResult Function(List<RecetaResumen> recetas)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) {
    if (exito != null) {
      return exito(recetas);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(RecetasCargando value) cargando,
    required TResult Function(RecetasExito value) exito,
    required TResult Function(RecetasError value) error,
  }) {
    return exito(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(RecetasCargando value)? cargando,
    TResult? Function(RecetasExito value)? exito,
    TResult? Function(RecetasError value)? error,
  }) {
    return exito?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(RecetasCargando value)? cargando,
    TResult Function(RecetasExito value)? exito,
    TResult Function(RecetasError value)? error,
    required TResult orElse(),
  }) {
    if (exito != null) {
      return exito(this);
    }
    return orElse();
  }
}

abstract class RecetasExito implements EstadoRecetas {
  const factory RecetasExito(final List<RecetaResumen> recetas) =
      _$RecetasExitoImpl;

  List<RecetaResumen> get recetas;

  /// Create a copy of EstadoRecetas
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RecetasExitoImplCopyWith<_$RecetasExitoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$RecetasErrorImplCopyWith<$Res> {
  factory _$$RecetasErrorImplCopyWith(
    _$RecetasErrorImpl value,
    $Res Function(_$RecetasErrorImpl) then,
  ) = __$$RecetasErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String mensaje});
}

/// @nodoc
class __$$RecetasErrorImplCopyWithImpl<$Res>
    extends _$EstadoRecetasCopyWithImpl<$Res, _$RecetasErrorImpl>
    implements _$$RecetasErrorImplCopyWith<$Res> {
  __$$RecetasErrorImplCopyWithImpl(
    _$RecetasErrorImpl _value,
    $Res Function(_$RecetasErrorImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoRecetas
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? mensaje = null}) {
    return _then(
      _$RecetasErrorImpl(
        null == mensaje
            ? _value.mensaje
            : mensaje // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc

class _$RecetasErrorImpl implements RecetasError {
  const _$RecetasErrorImpl(this.mensaje);

  @override
  final String mensaje;

  @override
  String toString() {
    return 'EstadoRecetas.error(mensaje: $mensaje)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RecetasErrorImpl &&
            (identical(other.mensaje, mensaje) || other.mensaje == mensaje));
  }

  @override
  int get hashCode => Object.hash(runtimeType, mensaje);

  /// Create a copy of EstadoRecetas
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RecetasErrorImplCopyWith<_$RecetasErrorImpl> get copyWith =>
      __$$RecetasErrorImplCopyWithImpl<_$RecetasErrorImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() cargando,
    required TResult Function(List<RecetaResumen> recetas) exito,
    required TResult Function(String mensaje) error,
  }) {
    return error(mensaje);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? cargando,
    TResult? Function(List<RecetaResumen> recetas)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return error?.call(mensaje);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? cargando,
    TResult Function(List<RecetaResumen> recetas)? exito,
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
    required TResult Function(RecetasCargando value) cargando,
    required TResult Function(RecetasExito value) exito,
    required TResult Function(RecetasError value) error,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(RecetasCargando value)? cargando,
    TResult? Function(RecetasExito value)? exito,
    TResult? Function(RecetasError value)? error,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(RecetasCargando value)? cargando,
    TResult Function(RecetasExito value)? exito,
    TResult Function(RecetasError value)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class RecetasError implements EstadoRecetas {
  const factory RecetasError(final String mensaje) = _$RecetasErrorImpl;

  String get mensaje;

  /// Create a copy of EstadoRecetas
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RecetasErrorImplCopyWith<_$RecetasErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
