use diesel::pg::PgConnection;
use diesel::r2d2::{ConnectionManager, CustomizeConnection};
use std::env;
use std::time::Duration;

pub type DbPool = diesel::r2d2::Pool<ConnectionManager<PgConnection>>;

#[derive(Debug)]
pub struct ConnectionOptions;

impl CustomizeConnection<PgConnection, diesel::r2d2::Error> for ConnectionOptions {
    fn on_acquire(&self, conn: &mut PgConnection) -> Result<(), diesel::r2d2::Error> {
        // Disable prepared statements for compatibility with Supabase/PgBouncer Transaction mode
        conn.set_prepared_statement_cache_size(0);
        Ok(())
    }
}

pub fn establish_connection() -> DbPool {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    diesel::r2d2::Pool::builder()
        .max_size(3) // Stay within Supabase free tier connection limit
        .min_idle(Some(1)) // Keep at least 1 idle connection ready
        .connection_timeout(Duration::from_secs(10))
        .connection_customizer(Box::new(ConnectionOptions))
        .build(manager)
        .expect("Failed to create pool.")
}
