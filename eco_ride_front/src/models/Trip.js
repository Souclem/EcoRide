export class Trip {
  constructor(dto) {
    this.id = dto.id;
    this.start_address = dto.start_address;
    this.start_latitude = dto.start_latitude;
    this.start_longitude = dto.start_longitude;
    this.end_address = dto.end_address;
    this.end_latitude = dto.end_latitude;
    this.end_longitude = dto.end_longitude;
    this.distance_km = dto.distance_km;
    this.start_date = dto.start_date;
    this.price_per_seat = dto.price_per_seat;
    this.total_seats = dto.total_seats;
    this.taken_seats = dto.taken_seats || 0;
    this.status = dto.status || "available";
    this.co2 = dto.co2 || 0;
    this.creation_date = dto.creation_date || new Date();
  }

  /**
   * Nombre de places disponibles
   */
  get availableSeats() {
    return this.total_seats - this.taken_seats;
  }

  /**
   * Vérifie si le trajet est disponible
   */
  isAvailable() {
    return this.status === "available" && this.availableSeats > 0;
  }

  /**
   * Formatte la date pour l'affichage
   */
  getFormattedDate() {
    return new Date(this.start_date).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
}
