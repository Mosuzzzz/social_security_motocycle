use crate::infrastructure::db::connection::DbPool;
use crate::infrastructure::db::models::MotorcycleModel;
use crate::infrastructure::db::schema::motorcycles;
use diesel::prelude::*;

#[derive(Clone)]
pub struct MotorcycleRepository {
    pool: DbPool,
}

impl MotorcycleRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create_motorcycle(
        &self,
        brand: String,
        model: String,
        license_plate: String,
        user_id: i32,
    ) -> Result<MotorcycleModel, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        // Simplified insert without a dedicated "New" struct if possible,
        // but Diesel usually requires one or a tuple.
        // Let's use a tuple for simplicity or just define a local struct.

        #[derive(Insertable)]
        #[diesel(table_name = motorcycles)]
        struct NewBike {
            brand: String,
            model: String,
            license_plate: String,
            user_id: i32,
        }

        let new_bike = NewBike {
            brand,
            model,
            license_plate,
            user_id,
        };

        diesel::insert_into(motorcycles::table)
            .values(&new_bike)
            .get_result(&mut conn)
            .map_err(|e| e.to_string())
    }

    pub async fn find_by_user(&self, user_id: i32) -> Result<Vec<MotorcycleModel>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        motorcycles::table
            .filter(motorcycles::user_id.eq(user_id))
            .load::<MotorcycleModel>(&mut conn)
            .map_err(|e| e.to_string())
    }

    pub async fn find_all(&self) -> Result<Vec<MotorcycleModel>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        motorcycles::table
            .load::<MotorcycleModel>(&mut conn)
            .map_err(|e| e.to_string())
    }
}
