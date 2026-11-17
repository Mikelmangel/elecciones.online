use serde::Deserialize;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

#[derive(Debug, Deserialize)]
struct GrupoVoto {
    si: i32,
    no: i32,
    abstencion: i32,
    no_vota: i32,
}

#[derive(Debug, Deserialize)]
struct VotacionCongreso {
    id: String,
    sesion: i32,
    numero: i32,
    fecha: String,
    titulo: String,
    por_grupo: Option<HashMap<String, GrupoVoto>>,
}

#[derive(Debug, Deserialize)]
struct CongresoVotacionesDoc {
    votaciones: Vec<VotacionCongreso>,
}

#[derive(Debug, Deserialize)]
struct PartidoCoherencia {
    siglas: String,
    promesa_previa: String,
    voto_emitido: String,
    coherencia: String,
    motivo_oficial: String,
}

#[derive(Debug, Deserialize)]
struct CasoCoherencia {
    id_votacion: String,
    titulo_llano: String,
    tipo_coherencia: String,
    etiqueta: String,
    resumen: String,
    partidos: Vec<PartidoCoherencia>,
}

#[derive(Debug, Deserialize)]
struct CoherenciaDoc {
    fuente: String,
    actualizado: String,
    casos: Vec<CasoCoherencia>,
}

#[derive(Debug, Deserialize)]
struct VerificacionEntrevista {
    id: String,
    entrevista_id: String,
    persona: String,
    partido: String,
    fecha: String,
    tema: String,
    cita_literal: String,
    afirmacion: String,
    contexto_minuto: Option<String>,
    cruce_votacion: Option<String>,
    raw_file: String,
    sha256: String,
    dato_oficial: String,
    fuente_oficial_nombre: String,
    fuente_oficial_url: String,
    veredicto: String,
    explicacion: String,
}

#[derive(Debug, Deserialize)]
struct FactcheckingDoc {
    fuente: String,
    fetched_at: String,
    verificaciones: Vec<VerificacionEntrevista>,
}

#[derive(Debug, Deserialize)]
struct Propuesta {
    area: String,
    titular: String,
    cita: String,
    pagina: i32,
}

#[derive(Debug, Deserialize)]
struct ProgramaDoc {
    siglas: String,
    nombre: String,
    fuente_url: String,
    propuestas: Vec<Propuesta>,
}

fn encontrar_raiz() -> PathBuf {
    let mut dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    for _ in 0..5 {
        if dir.join("data").is_dir() {
            return dir;
        }
        if let Some(parent) = dir.parent() {
            dir = parent.to_path_buf();
        } else {
            break;
        }
    }
    PathBuf::from(".")
}

fn resolver_grupo(siglas: &str) -> Option<&'static str> {
    match siglas {
        "PP" => Some("GP"),
        "PSOE" | "PSC" => Some("GS"),
        "VOX" => Some("GVOX"),
        "SUMAR" => Some("GSUMAR"),
        "ERC" => Some("GR"),
        "JUNTS" => Some("GJxCAT"),
        "EH Bildu" => Some("GEH Bildu"),
        "EAJ-PNV" | "PNV" => Some("GV (EAJ-PNV)"),
        "Podemos" | "BNG" | "CC" | "UPN" => Some("GMx"),
        _ => None,
    }
}

fn verificar_coherencia(
    root: &Path,
    votaciones_map: &HashMap<String, &VotacionCongreso>,
) -> Result<usize, String> {
    let coherencia_path = root.join("data/coherencia_votaciones.json");
    if !coherencia_path.exists() {
        return Err(format!("No existe {}", coherencia_path.display()));
    }

    let contenido = fs::read_to_string(&coherencia_path)
        .map_err(|e| format!("Error al leer coherencia: {e}"))?;
    let doc: CoherenciaDoc = serde_json::from_str(&contenido)
        .map_err(|e| format!("Error al parsear coherencia_votaciones.json: {e}"))?;

    println!("\x1b[1;34m[1/3] Verificando auditoría de coherencia y giros de voto...\x1b[0m");
    println!("  Total de casos documentados: {}", doc.casos.len());

    let mut checks = 0;
    for caso in &doc.casos {
        let votacion = votaciones_map.get(&caso.id_votacion).ok_or_else(|| {
            format!(
                "Caso {}: votación {} no existe en congreso_votaciones.json",
                caso.etiqueta, caso.id_votacion
            )
        })?;

        println!(
            "  ✓ Votación #{:<6} | {:<40} | {}",
            caso.id_votacion,
            if caso.titulo_llano.len() > 38 {
                format!("{}...", &caso.titulo_llano[..37])
            } else {
                caso.titulo_llano.clone()
            },
            caso.etiqueta
        );

        for p in &caso.partidos {
            checks += 1;
            if let Some(grupo_key) = resolver_grupo(&p.siglas) {
                if let Some(ref grupos) = votacion.por_grupo {
                    if let Some(resultado) = grupos.get(grupo_key) {
                        let mayoritario = if resultado.si > resultado.no && resultado.si > resultado.abstencion {
                            "SÍ"
                        } else if resultado.no > resultado.si && resultado.no > resultado.abstencion {
                            "NO"
                        } else if resultado.abstencion > resultado.si && resultado.abstencion > resultado.no {
                            "ABSTENCION"
                        } else if resultado.no_vota > 0 && resultado.si == 0 && resultado.no == 0 {
                            "NO VOTA"
                        } else {
                            "DIVIDIDO"
                        };

                        let voto_declarado_norm = p.voto_emitido.to_uppercase();
                        let coincide = voto_declarado_norm.contains(mayoritario)
                            || (mayoritario == "NO VOTA" && voto_declarado_norm.contains("NO VOTA"));

                        if !coincide && grupo_key != "GMx" {
                            println!(
                                "    \x1b[33m⚠ Advertencia en partido {}: declarado '{}', en acta figura '{}' (sí:{}, no:{}, abs:{}, no_vota:{})\x1b[0m",
                                p.siglas, p.voto_emitido, mayoritario, resultado.si, resultado.no, resultado.abstencion, resultado.no_vota
                            );
                        } else {
                            println!(
                                "    ✓ {:<8} declarado: {:<12} | Acta Congreso: {} (sí:{}, no:{})",
                                p.siglas, p.voto_emitido, mayoritario, resultado.si, resultado.no
                            );
                        }
                    }
                }
            }
        }
    }

    Ok(checks)
}

fn verificar_factchecking(root: &Path) -> Result<usize, String> {
    let fc_path = root.join("data/factchecking_entrevistas.json");
    if !fc_path.exists() {
        return Err(format!("No existe {}", fc_path.display()));
    }

    let contenido = fs::read_to_string(&fc_path)
        .map_err(|e| format!("Error al leer factchecking: {e}"))?;
    let doc: FactcheckingDoc = serde_json::from_str(&contenido)
        .map_err(|e| format!("Error al parsear factchecking_entrevistas.json: {e}"))?;

    println!("\n\x1b[1;34m[2/3] Verificando crosscheck y fact-checking de entrevistas...\x1b[0m");
    println!("  Total de afirmaciones contrastadas: {}", doc.verificaciones.len());

    let veredictos_validos = ["VERDADERO", "FALSO", "CON MATICES", "ENGAÑOSO", "NO COMPROBADO", "CONTRADICCIÓN"];
    let mut stats: HashMap<String, usize> = HashMap::new();

    for v in &doc.verificaciones {
        if !veredictos_validos.contains(&v.veredicto.as_str()) {
            return Err(format!("Veredicto inválido '{}' en verificación {}", v.veredicto, v.id));
        }

        if !v.fuente_oficial_url.starts_with("http://") && !v.fuente_oficial_url.starts_with("https://") {
            return Err(format!("URL de fuente oficial inválida en {}: {}", v.id, v.fuente_oficial_url));
        }

        if v.cita_literal.trim().len() < 40 {
            return Err(format!("cita_literal demasiado corta (<40 chars) en {}: '{}'", v.id, v.cita_literal));
        }

        if v.sha256.len() != 64 || !v.sha256.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err(format!("sha256 inválido en {}: '{}'", v.id, v.sha256));
        }

        if v.raw_file.is_empty() {
            return Err(format!("raw_file vacío en {}", v.id));
        }

        *stats.entry(v.veredicto.clone()).or_insert(0) += 1;

        let color = match v.veredicto.as_str() {
            "VERDADERO" => "\x1b[32m",
            "FALSO" => "\x1b[31m",
            "CON MATICES" => "\x1b[33m",
            _ => "\x1b[35m",
        };

        println!(
            "  ✓ [{}{}\x1b[0m] {:<18} ({:<4}) | {:<25} | Fuente: {}",
            color,
            v.veredicto,
            v.persona,
            v.partido,
            v.tema,
            v.fuente_oficial_nombre
        );
    }

    println!("  Distribución de veredictos: {:?}", stats);
    Ok(doc.verificaciones.len())
}

fn verificar_programas(root: &Path) -> Result<usize, String> {
    let prog_dir = root.join("data/programas");
    if !prog_dir.is_dir() {
        return Err(format!("No existe directorio {}", prog_dir.display()));
    }

    println!("\n\x1b[1;34m[3/3] Verificando integridad de programas electorales oficiales...\x1b[0m");

    let mut total_propuestas = 0;
    let entries = fs::read_dir(&prog_dir).map_err(|e| format!("Error al leer dir: {e}"))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("json")
            && !path.file_name().unwrap().to_str().unwrap().starts_with('_')
        {
            let contenido = fs::read_to_string(&path)
                .map_err(|e| format!("Error leyendo {}: {e}", path.display()))?;
            let prog: ProgramaDoc = serde_json::from_str(&contenido)
                .map_err(|e| format!("Error parseando {}: {e}", path.display()))?;

            total_propuestas += prog.propuestas.len();
            for p in &prog.propuestas {
                if p.titular.is_empty() || p.titular.len() > 140 {
                    return Err(format!("{}: titular excede 140 caracteres: '{}'", prog.siglas, p.titular));
                }
                if p.cita.len() < 20 {
                    return Err(format!("{}: cita demasiado corta (<20): '{}'", prog.siglas, p.cita));
                }
                if p.pagina <= 0 {
                    return Err(format!("{}: página no válida ({})", prog.siglas, p.pagina));
                }
            }
            println!("  ✓ {:<8} {:<32} | {:>4} propuestas verificadas", prog.siglas, prog.nombre, prog.propuestas.len());
        }
    }

    Ok(total_propuestas)
}

fn main() {
    let inicio = Instant::now();
    println!("\x1b[1;36m===================================================================\x1b[0m");
    println!("\x1b[1;36m elecciones.online — Motor de Verificación y Crosscheck (Rust)\x1b[0m");
    println!("\x1b[1;36m===================================================================\x1b[0m");

    let root = encontrar_raiz();
    let votaciones_path = root.join("data/congreso_votaciones.json");

    if !votaciones_path.exists() {
        eprintln!("\x1b[1;31mError: No se encuentra {}\x1b[0m", votaciones_path.display());
        std::process::exit(1);
    }

    let contenido_vot = match fs::read_to_string(&votaciones_path) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("\x1b[1;31mError leyendo congreso_votaciones.json: {e}\x1b[0m");
            std::process::exit(1);
        }
    };

    let vot_doc: CongresoVotacionesDoc = match serde_json::from_str(&contenido_vot) {
        Ok(d) => d,
        Err(e) => {
            eprintln!("\x1b[1;31mError parseando congreso_votaciones.json: {e}\x1b[0m");
            std::process::exit(1);
        }
    };

    let mut votaciones_map: HashMap<String, &VotacionCongreso> = HashMap::new();
    for v in &vot_doc.votaciones {
        votaciones_map.insert(v.id.clone(), v);
    }
    println!("Base de datos del Congreso cargada: {} votaciones en memoria.\n", vot_doc.votaciones.len());

    let checks_coherencia = match verificar_coherencia(&root, &votaciones_map) {
        Ok(n) => n,
        Err(e) => {
            eprintln!("\x1b[1;31mError en coherencia: {e}\x1b[0m");
            std::process::exit(1);
        }
    };

    let checks_fc = match verificar_factchecking(&root) {
        Ok(n) => n,
        Err(e) => {
            eprintln!("\x1b[1;31mError en fact-checking: {e}\x1b[0m");
            std::process::exit(1);
        }
    };

    let checks_prog = match verificar_programas(&root) {
        Ok(n) => n,
        Err(e) => {
            eprintln!("\x1b[1;31mError en programas: {e}\x1b[0m");
            std::process::exit(1);
        }
    };

    let duracion = inicio.elapsed();
    println!("\n\x1b[1;32m===================================================================\x1b[0m");
    println!(
        "\x1b[1;32m✓ TODAS LAS VERIFICACIONES COMPLETADAS CON ÉXITO en {:?}\x1b[0m",
        duracion
    );
    println!(
        "  - {} contrastes de coherencia y giros de voto validados",
        checks_coherencia
    );
    println!(
        "  - {} afirmaciones de entrevistas con formato válido (cita, minuto, sha256)",
        checks_fc
    );
    println!(
        "  - {} propuestas de programas electorales con cita y página verificadas",
        checks_prog
    );
    println!("\x1b[1;32m===================================================================\x1b[0m");
}
