import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sigo_ollas/config/inyeccion/inyeccion_dependencias.dart';
import 'package:sigo_ollas/core/red/resultado.dart';
import 'package:sigo_ollas/features/auth/domain/entidades/usuario.dart';
import 'package:sigo_ollas/features/auth/domain/repositorio_auth.dart';
import 'package:sigo_ollas/features/auth/domain/resultado_login.dart';
import 'package:sigo_ollas/features/auth/presentation/paginas/pagina_login.dart';

/// Doble de prueba del repositorio de autenticación.
class _RepositorioAuthFalso implements RepositorioAuth {
  @override
  Future<Resultado<ResultadoLogin>> iniciarSesion({required String email, required String password}) async {
    return const Resultado<ResultadoLogin>.exito(MfaPendiente(tempToken: 't', email: 'a@b.pe'));
  }

  @override
  Future<Resultado<Usuario>> verificarCodigo({required String email, required String tempToken, required String codigo}) async {
    throw UnimplementedError();
  }

  @override
  Future<Resultado<Usuario>> obtenerUsuarioActual() async => throw UnimplementedError();

  @override
  Future<bool> haySesionActiva() async => false;

  @override
  Future<void> cerrarSesion() async {}
}

void main() {
  setUp(() {
    sl.registerLazySingleton<RepositorioAuth>(() => _RepositorioAuthFalso());
  });

  tearDown(() => sl.reset());

  testWidgets('muestra los campos de correo y contraseña y el botón Ingresar', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: PaginaLogin())),
    );
    expect(find.text('Bienvenida'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Ingresar'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(2));
  });

  testWidgets('valida que no se envíe el formulario vacío', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: PaginaLogin())),
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Ingresar'));
    await tester.pump();
    expect(find.text('Ingresa tu correo.'), findsOneWidget);
    expect(find.text('Ingresa tu contraseña.'), findsOneWidget);
  });
}
