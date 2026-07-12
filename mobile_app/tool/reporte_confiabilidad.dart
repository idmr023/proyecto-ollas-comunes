// ignore_for_file: avoid_print

class CategoriaLighthouse {
  const CategoriaLighthouse(this.nombre, this.peso, this.puntaje);

  final String nombre;
  final double peso;
  final int puntaje;

  double get ponderado => peso * puntaje;
}

void main() {
  const List<CategoriaLighthouse> categorias = <CategoriaLighthouse>[
    CategoriaLighthouse('Performance percibida', 0.25, 92),
    CategoriaLighthouse('Accesibilidad', 0.20, 91),
    CategoriaLighthouse('Buenas practicas', 0.20, 92),
    CategoriaLighthouse('Confiabilidad offline', 0.25, 93),
    CategoriaLighthouse('Testing', 0.10, 92),
  ];

  final double puntajeFinal = categorias.fold<double>(
    0,
    (double total, CategoriaLighthouse c) => total + c.ponderado,
  );

  const int accionesSinRed = 4;
  const int accionesPreservadas = 4;
  const int accionesPendientes = 4;
  const int accionesSincronizadas = 4;
  const int controlesMadurez = 3;
  const int controlesMadurezOk = 3;
  const int tiempoTotalMin = 120;
  const int fallosCriticos = 1;
  const int tiempoRecuperacionSeg = 45;
  const int tiempoUsableMin = 119;

  final double madurez = controlesMadurezOk / controlesMadurez * 100;
  final double disponibilidad = tiempoUsableMin / tiempoTotalMin * 100;
  final double toleranciaFallos = accionesPreservadas / accionesSinRed * 100;
  final double recuperabilidad =
      accionesSincronizadas / accionesPendientes * 100;
  final double mtbf = tiempoTotalMin / fallosCriticos;
  const int mttr = tiempoRecuperacionSeg;

  print('# Reporte simulado de confiabilidad movil');
  print('');
  print('| Categoria | Peso | Puntaje | Aporte |');
  print('| --- | ---: | ---: | ---: |');
  for (final CategoriaLighthouse c in categorias) {
    print(
      '| ${c.nombre} | ${(c.peso * 100).toStringAsFixed(0)}% | ${c.puntaje} | ${c.ponderado.toStringAsFixed(2)} |',
    );
  }
  print('');
  print(
    'Puntaje Lighthouse movil simulado: ${puntajeFinal.toStringAsFixed(1)}',
  );
  print('');
  print('## ISO/IEC 25010 - Reliability');
  print('');
  print('| Metrica | Resultado | Meta | Estado |');
  print('| --- | ---: | ---: | --- |');
  print('| Madurez | ${madurez.toStringAsFixed(2)}% | 100% | OK |');
  print(
    '| Disponibilidad | ${disponibilidad.toStringAsFixed(2)}% | >= 99% | OK |',
  );
  print(
    '| Tolerancia a fallos | ${toleranciaFallos.toStringAsFixed(2)}% | 100% | OK |',
  );
  print(
    '| Recoverability | ${recuperabilidad.toStringAsFixed(2)}% | >= 95% | OK |',
  );
  print('| MTBF | ${mtbf.toStringAsFixed(1)} min | >= 60 min | OK |');
  print('| MTTR | ${mttr.toStringAsFixed(0)} s | <= 120 s | OK |');
}
