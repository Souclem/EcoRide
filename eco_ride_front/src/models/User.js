export class User {
  constructor(dto) {
    this.id = dto.id;
    this.email = dto.email;
    this.name = dto.name || null;
    this.role = dto.role || "user";
  }

  isAdmin() {
    return this.role === "admin";
  }
}
