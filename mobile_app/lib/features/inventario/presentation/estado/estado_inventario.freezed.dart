// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'estado_inventario.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$EstadoInventario {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<Insumo> insumos) exito,
    required TResult Function(String mensaje) error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<Insumo> insumos)? exito,
    TResult? Function(String mensaje)? error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<Insumo> insumos)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(InventarioInicial value) inicial,
    required TResult Function(InventarioCargando value) cargando,
    required TResult Function(InventarioExito value) exito,
    required TResult Function(InventarioError value) error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(InventarioInicial value)? inicial,
    TResult? Function(InventarioCargando value)? cargando,
    TResult? Function(InventarioExito value)? exito,
    TResult? Function(InventarioError value)? error,
  }) => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(InventarioInicial value)? inicial,
    TResult Function(InventarioCargando value)? cargando,
    TResult Function(InventarioExito value)? exito,
    TResult Function(InventarioError value)? error,
    required TResult orElse(),
  }) => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EstadoInventarioCopyWith<$Res> {
  factory $EstadoInventarioCopyWith(
    EstadoInventario value,
    $Res Function(EstadoInventario) then,
  ) = _$EstadoInventarioCopyWithImpl<$Res, EstadoInventario>;
}

/// @nodoc
class _$EstadoInventarioCopyWithImpl<$Res, $Val extends EstadoInventario>
    implements $EstadoInventarioCopyWith<$Res> {
  _$EstadoInventarioCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EstadoInventario
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc
abstract class _$$InventarioInicialImplCopyWith<$Res> {
  factory _$$InventarioInicialImplCopyWith(
    _$InventarioInicialImpl value,
    $Res Function(_$InventarioInicialImpl) then,
  ) = __$$InventarioInicialImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$InventarioInicialImplCopyWithImpl<$Res>
    extends _$EstadoInventarioCopyWithImpl<$Res, _$InventarioInicialImpl>
    implements _$$InventarioInicialImplCopyWith<$Res> {
  __$$InventarioInicialImplCopyWithImpl(
    _$InventarioInicialImpl _value,
    $Res Function(_$InventarioInicialImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoInventario
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$InventarioInicialImpl implements InventarioInicial {
  const _$InventarioInicialImpl();

  @override
  String toString() {
    return 'EstadoInventario.inicial()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$InventarioInicialImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<Insumo> insumos) exito,
    required TResult Function(String mensaje) error,
  }) {
    return inicial();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<Insumo> insumos)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return inicial?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<Insumo> insumos)? exito,
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
    required TResult Function(InventarioInicial value) inicial,
    required TResult Function(InventarioCargando value) cargando,
    required TResult Function(InventarioExito value) exito,
    required TResult Function(InventarioError value) error,
  }) {
    return inicial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(InventarioInicial value)? inicial,
    TResult? Function(InventarioCargando value)? cargando,
    TResult? Function(InventarioExito value)? exito,
    TResult? Function(InventarioError value)? error,
  }) {
    return inicial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(InventarioInicial value)? inicial,
    TResult Function(InventarioCargando value)? cargando,
    TResult Function(InventarioExito value)? exito,
    TResult Function(InventarioError value)? error,
    required TResult orElse(),
  }) {
    if (inicial != null) {
      return inicial(this);
    }
    return orElse();
  }
}

abstract class InventarioInicial implements EstadoInventario {
  const factory InventarioInicial() = _$InventarioInicialImpl;
}

/// @nodoc
abstract class _$$InventarioCargandoImplCopyWith<$Res> {
  factory _$$InventarioCargandoImplCopyWith(
    _$InventarioCargandoImpl value,
    $Res Function(_$InventarioCargandoImpl) then,
  ) = __$$InventarioCargandoImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$InventarioCargandoImplCopyWithImpl<$Res>
    extends _$EstadoInventarioCopyWithImpl<$Res, _$InventarioCargandoImpl>
    implements _$$InventarioCargandoImplCopyWith<$Res> {
  __$$InventarioCargandoImplCopyWithImpl(
    _$InventarioCargandoImpl _value,
    $Res Function(_$InventarioCargandoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoInventario
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc

class _$InventarioCargandoImpl implements InventarioCargando {
  const _$InventarioCargandoImpl();

  @override
  String toString() {
    return 'EstadoInventario.cargando()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$InventarioCargandoImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<Insumo> insumos) exito,
    required TResult Function(String mensaje) error,
  }) {
    return cargando();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<Insumo> insumos)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return cargando?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<Insumo> insumos)? exito,
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
    required TResult Function(InventarioInicial value) inicial,
    required TResult Function(InventarioCargando value) cargando,
    required TResult Function(InventarioExito value) exito,
    required TResult Function(InventarioError value) error,
  }) {
    return cargando(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(InventarioInicial value)? inicial,
    TResult? Function(InventarioCargando value)? cargando,
    TResult? Function(InventarioExito value)? exito,
    TResult? Function(InventarioError value)? error,
  }) {
    return cargando?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(InventarioInicial value)? inicial,
    TResult Function(InventarioCargando value)? cargando,
    TResult Function(InventarioExito value)? exito,
    TResult Function(InventarioError value)? error,
    required TResult orElse(),
  }) {
    if (cargando != null) {
      return cargando(this);
    }
    return orElse();
  }
}

abstract class InventarioCargando implements EstadoInventario {
  const factory InventarioCargando() = _$InventarioCargandoImpl;
}

/// @nodoc
abstract class _$$InventarioExitoImplCopyWith<$Res> {
  factory _$$InventarioExitoImplCopyWith(
    _$InventarioExitoImpl value,
    $Res Function(_$InventarioExitoImpl) then,
  ) = __$$InventarioExitoImplCopyWithImpl<$Res>;
  @useResult
  $Res call({List<Insumo> insumos});
}

/// @nodoc
class __$$InventarioExitoImplCopyWithImpl<$Res>
    extends _$EstadoInventarioCopyWithImpl<$Res, _$InventarioExitoImpl>
    implements _$$InventarioExitoImplCopyWith<$Res> {
  __$$InventarioExitoImplCopyWithImpl(
    _$InventarioExitoImpl _value,
    $Res Function(_$InventarioExitoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoInventario
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? insumos = null}) {
    return _then(
      _$InventarioExitoImpl(
        null == insumos
            ? _value._insumos
            : insumos // ignore: cast_nullable_to_non_nullable
                  as List<Insumo>,
      ),
    );
  }
}

/// @nodoc

class _$InventarioExitoImpl implements InventarioExito {
  const _$InventarioExitoImpl(final List<Insumo> insumos) : _insumos = insumos;

  final List<Insumo> _insumos;
  @override
  List<Insumo> get insumos {
    if (_insumos is EqualUnmodifiableListView) return _insumos;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_insumos);
  }

  @override
  String toString() {
    return 'EstadoInventario.exito(insumos: $insumos)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InventarioExitoImpl &&
            const DeepCollectionEquality().equals(other._insumos, _insumos));
  }

  @override
  int get hashCode =>
      Object.hash(runtimeType, const DeepCollectionEquality().hash(_insumos));

  /// Create a copy of EstadoInventario
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$InventarioExitoImplCopyWith<_$InventarioExitoImpl> get copyWith =>
      __$$InventarioExitoImplCopyWithImpl<_$InventarioExitoImpl>(
        this,
        _$identity,
      );

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<Insumo> insumos) exito,
    required TResult Function(String mensaje) error,
  }) {
    return exito(insumos);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<Insumo> insumos)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return exito?.call(insumos);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<Insumo> insumos)? exito,
    TResult Function(String mensaje)? error,
    required TResult orElse(),
  }) {
    if (exito != null) {
      return exito(insumos);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(InventarioInicial value) inicial,
    required TResult Function(InventarioCargando value) cargando,
    required TResult Function(InventarioExito value) exito,
    required TResult Function(InventarioError value) error,
  }) {
    return exito(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(InventarioInicial value)? inicial,
    TResult? Function(InventarioCargando value)? cargando,
    TResult? Function(InventarioExito value)? exito,
    TResult? Function(InventarioError value)? error,
  }) {
    return exito?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(InventarioInicial value)? inicial,
    TResult Function(InventarioCargando value)? cargando,
    TResult Function(InventarioExito value)? exito,
    TResult Function(InventarioError value)? error,
    required TResult orElse(),
  }) {
    if (exito != null) {
      return exito(this);
    }
    return orElse();
  }
}

abstract class InventarioExito implements EstadoInventario {
  const factory InventarioExito(final List<Insumo> insumos) =
      _$InventarioExitoImpl;

  List<Insumo> get insumos;

  /// Create a copy of EstadoInventario
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$InventarioExitoImplCopyWith<_$InventarioExitoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$InventarioErrorImplCopyWith<$Res> {
  factory _$$InventarioErrorImplCopyWith(
    _$InventarioErrorImpl value,
    $Res Function(_$InventarioErrorImpl) then,
  ) = __$$InventarioErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String mensaje});
}

/// @nodoc
class __$$InventarioErrorImplCopyWithImpl<$Res>
    extends _$EstadoInventarioCopyWithImpl<$Res, _$InventarioErrorImpl>
    implements _$$InventarioErrorImplCopyWith<$Res> {
  __$$InventarioErrorImplCopyWithImpl(
    _$InventarioErrorImpl _value,
    $Res Function(_$InventarioErrorImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EstadoInventario
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? mensaje = null}) {
    return _then(
      _$InventarioErrorImpl(
        null == mensaje
            ? _value.mensaje
            : mensaje // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc

class _$InventarioErrorImpl implements InventarioError {
  const _$InventarioErrorImpl(this.mensaje);

  @override
  final String mensaje;

  @override
  String toString() {
    return 'EstadoInventario.error(mensaje: $mensaje)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InventarioErrorImpl &&
            (identical(other.mensaje, mensaje) || other.mensaje == mensaje));
  }

  @override
  int get hashCode => Object.hash(runtimeType, mensaje);

  /// Create a copy of EstadoInventario
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$InventarioErrorImplCopyWith<_$InventarioErrorImpl> get copyWith =>
      __$$InventarioErrorImplCopyWithImpl<_$InventarioErrorImpl>(
        this,
        _$identity,
      );

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() inicial,
    required TResult Function() cargando,
    required TResult Function(List<Insumo> insumos) exito,
    required TResult Function(String mensaje) error,
  }) {
    return error(mensaje);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? inicial,
    TResult? Function()? cargando,
    TResult? Function(List<Insumo> insumos)? exito,
    TResult? Function(String mensaje)? error,
  }) {
    return error?.call(mensaje);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? inicial,
    TResult Function()? cargando,
    TResult Function(List<Insumo> insumos)? exito,
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
    required TResult Function(InventarioInicial value) inicial,
    required TResult Function(InventarioCargando value) cargando,
    required TResult Function(InventarioExito value) exito,
    required TResult Function(InventarioError value) error,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(InventarioInicial value)? inicial,
    TResult? Function(InventarioCargando value)? cargando,
    TResult? Function(InventarioExito value)? exito,
    TResult? Function(InventarioError value)? error,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(InventarioInicial value)? inicial,
    TResult Function(InventarioCargando value)? cargando,
    TResult Function(InventarioExito value)? exito,
    TResult Function(InventarioError value)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class InventarioError implements EstadoInventario {
  const factory InventarioError(final String mensaje) = _$InventarioErrorImpl;

  String get mensaje;

  /// Create a copy of EstadoInventario
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$InventarioErrorImplCopyWith<_$InventarioErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
