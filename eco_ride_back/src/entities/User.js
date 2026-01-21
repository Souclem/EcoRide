class User {
    constructor(id, email, name, last_name, password, preferred_language, creation_date, role = 'user', total_co2_saved = 0, total_trees_planted = 0, rating = null) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.last_name = last_name;
        this.password = password;
        this.preferred_language = preferred_language;
        this.creation_date = creation_date;
        this.role = role;
        this.total_co2_saved = total_co2_saved;
        this.total_trees_planted = total_trees_planted;
        this.rating = rating;
    }
}

module.exports = User;
