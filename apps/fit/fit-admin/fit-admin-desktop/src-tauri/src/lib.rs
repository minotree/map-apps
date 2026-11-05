mod image_service;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut image_service = match image_service::ImageService::start() {
    Ok(service) => Some(service),
    Err(error) => {
      eprintln!("이미지 처리 서버를 시작하지 못했습니다. 이미지 편집 기능만 사용할 수 없습니다: {error}");
      None
    }
  };
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(move |_app, event| {
      if matches!(event, tauri::RunEvent::Exit) {
        drop(image_service.take());
      }
    });
}
