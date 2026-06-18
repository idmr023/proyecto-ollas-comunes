// dart format width=80
// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// AutoRouterGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

part of 'app_router.dart';

/// generated route for
/// [PaginaAlertas]
class AlertasRoute extends PageRouteInfo<void> {
  const AlertasRoute({List<PageRouteInfo>? children})
    : super(AlertasRoute.name, initialChildren: children);

  static const String name = 'AlertasRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PaginaAlertas();
    },
  );
}

/// generated route for
/// [PaginaDetalleInsumo]
class DetalleInsumoRoute extends PageRouteInfo<DetalleInsumoRouteArgs> {
  DetalleInsumoRoute({
    Key? key,
    required Insumo insumo,
    List<PageRouteInfo>? children,
  }) : super(
         DetalleInsumoRoute.name,
         args: DetalleInsumoRouteArgs(key: key, insumo: insumo),
         initialChildren: children,
       );

  static const String name = 'DetalleInsumoRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<DetalleInsumoRouteArgs>();
      return PaginaDetalleInsumo(key: args.key, insumo: args.insumo);
    },
  );
}

class DetalleInsumoRouteArgs {
  const DetalleInsumoRouteArgs({this.key, required this.insumo});

  final Key? key;

  final Insumo insumo;

  @override
  String toString() {
    return 'DetalleInsumoRouteArgs{key: $key, insumo: $insumo}';
  }
}

/// generated route for
/// [PaginaEvidencias]
class EvidenciasRoute extends PageRouteInfo<void> {
  const EvidenciasRoute({List<PageRouteInfo>? children})
    : super(EvidenciasRoute.name, initialChildren: children);

  static const String name = 'EvidenciasRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PaginaEvidencias();
    },
  );
}

/// generated route for
/// [PaginaFichaBeneficiario]
class FichaBeneficiarioRoute extends PageRouteInfo<FichaBeneficiarioRouteArgs> {
  FichaBeneficiarioRoute({
    Key? key,
    required Beneficiario beneficiario,
    List<PageRouteInfo>? children,
  }) : super(
         FichaBeneficiarioRoute.name,
         args: FichaBeneficiarioRouteArgs(key: key, beneficiario: beneficiario),
         initialChildren: children,
       );

  static const String name = 'FichaBeneficiarioRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<FichaBeneficiarioRouteArgs>();
      return PaginaFichaBeneficiario(
        key: args.key,
        beneficiario: args.beneficiario,
      );
    },
  );
}

class FichaBeneficiarioRouteArgs {
  const FichaBeneficiarioRouteArgs({this.key, required this.beneficiario});

  final Key? key;

  final Beneficiario beneficiario;

  @override
  String toString() {
    return 'FichaBeneficiarioRouteArgs{key: $key, beneficiario: $beneficiario}';
  }
}

/// generated route for
/// [PaginaFormularioBeneficiario]
class FormularioBeneficiarioRoute
    extends PageRouteInfo<FormularioBeneficiarioRouteArgs> {
  FormularioBeneficiarioRoute({
    Key? key,
    Beneficiario? beneficiario,
    List<PageRouteInfo>? children,
  }) : super(
         FormularioBeneficiarioRoute.name,
         args: FormularioBeneficiarioRouteArgs(
           key: key,
           beneficiario: beneficiario,
         ),
         initialChildren: children,
       );

  static const String name = 'FormularioBeneficiarioRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<FormularioBeneficiarioRouteArgs>(
        orElse: () => const FormularioBeneficiarioRouteArgs(),
      );
      return PaginaFormularioBeneficiario(
        key: args.key,
        beneficiario: args.beneficiario,
      );
    },
  );
}

class FormularioBeneficiarioRouteArgs {
  const FormularioBeneficiarioRouteArgs({this.key, this.beneficiario});

  final Key? key;

  final Beneficiario? beneficiario;

  @override
  String toString() {
    return 'FormularioBeneficiarioRouteArgs{key: $key, beneficiario: $beneficiario}';
  }
}

/// generated route for
/// [PaginaHome]
class HomeRoute extends PageRouteInfo<void> {
  const HomeRoute({List<PageRouteInfo>? children})
    : super(HomeRoute.name, initialChildren: children);

  static const String name = 'HomeRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PaginaHome();
    },
  );
}

/// generated route for
/// [PaginaLogin]
class LoginRoute extends PageRouteInfo<void> {
  const LoginRoute({List<PageRouteInfo>? children})
    : super(LoginRoute.name, initialChildren: children);

  static const String name = 'LoginRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PaginaLogin();
    },
  );
}

/// generated route for
/// [PaginaMenuIa]
class MenuIaRoute extends PageRouteInfo<void> {
  const MenuIaRoute({List<PageRouteInfo>? children})
    : super(MenuIaRoute.name, initialChildren: children);

  static const String name = 'MenuIaRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PaginaMenuIa();
    },
  );
}

/// generated route for
/// [PaginaMovimiento]
class MovimientoRoute extends PageRouteInfo<MovimientoRouteArgs> {
  MovimientoRoute({
    Key? key,
    required Insumo insumo,
    List<PageRouteInfo>? children,
  }) : super(
         MovimientoRoute.name,
         args: MovimientoRouteArgs(key: key, insumo: insumo),
         initialChildren: children,
       );

  static const String name = 'MovimientoRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<MovimientoRouteArgs>();
      return PaginaMovimiento(key: args.key, insumo: args.insumo);
    },
  );
}

class MovimientoRouteArgs {
  const MovimientoRouteArgs({this.key, required this.insumo});

  final Key? key;

  final Insumo insumo;

  @override
  String toString() {
    return 'MovimientoRouteArgs{key: $key, insumo: $insumo}';
  }
}

/// generated route for
/// [PaginaSplash]
class SplashRoute extends PageRouteInfo<void> {
  const SplashRoute({List<PageRouteInfo>? children})
    : super(SplashRoute.name, initialChildren: children);

  static const String name = 'SplashRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PaginaSplash();
    },
  );
}

/// generated route for
/// [PaginaVerificacion]
class VerificacionRoute extends PageRouteInfo<VerificacionRouteArgs> {
  VerificacionRoute({
    Key? key,
    required ResultadoLogin datosLogin,
    List<PageRouteInfo>? children,
  }) : super(
         VerificacionRoute.name,
         args: VerificacionRouteArgs(key: key, datosLogin: datosLogin),
         initialChildren: children,
       );

  static const String name = 'VerificacionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<VerificacionRouteArgs>();
      return PaginaVerificacion(key: args.key, datosLogin: args.datosLogin);
    },
  );
}

class VerificacionRouteArgs {
  const VerificacionRouteArgs({this.key, required this.datosLogin});

  final Key? key;

  final ResultadoLogin datosLogin;

  @override
  String toString() {
    return 'VerificacionRouteArgs{key: $key, datosLogin: $datosLogin}';
  }
}
