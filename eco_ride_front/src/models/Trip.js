export class Trip {
  constructor(dto = {}) {
    this.id = dto.id || null;
    this.start_address = dto.start_address || '';
    this.start_latitude = dto.start_latitude || null;
    this.start_longitude = dto.start_longitude || null;
    this.end_address = dto.end_address || '';
    this.end_latitude = dto.end_latitude || null;
    this.end_longitude = dto.end_longitude || null;
    this.distance_km = dto.distance_km || 0;
    this.duration_minutes = dto.duration_minutes || 0;
    this.start_date = dto.start_date || '';
    this.start_time = dto.start_time || '';
    this.price_per_seat = dto.price_per_seat || 10;
    this.suggested_price = dto.suggested_price || null;
    this.total_seats = dto.total_seats || 3;
    this.taken_seats = dto.taken_seats || 0;
    this.status = dto.status || "available";
    this.co2 = dto.co2 || 0;
    this.creation_date = dto.creation_date || new Date();
  }

  // Méthode pour convertir en objet pour l'API
  toDTO() {
    // Combiner date et heure pour l'API
    const startDateTime = this.start_date && this.start_time
      ? `${this.start_date}T${this.start_time}:00`
      : null;

    return {
      start_address: this.start_address,
      start_latitude: this.start_latitude,
      start_longitude: this.start_longitude,
      end_address: this.end_address,
      end_latitude: this.end_latitude,
      end_longitude: this.end_longitude,
      distance_km: this.distance_km,
      start_date: startDateTime,
      price_per_seat: parseInt(this.price_per_seat),
      total_seats: parseInt(this.total_seats)
    };
  }

  // Validation
  isValid() {
    return !!(
      this.start_address &&
      this.start_latitude &&
      this.start_longitude &&
      this.end_address &&
      this.end_latitude &&
      this.end_longitude &&
      this.start_date &&
      this.start_time &&
      this.price_per_seat > 0 &&
      this.total_seats > 0
    );
  }
}
