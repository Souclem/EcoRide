class User {
    constructor(id, email, name, last_name, password, preferred_language, creation_date, role = 'user', co2_saved = 0, tree_planted = 0) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.last_name = last_name;
        this.password = password;
        this.preferred_language = preferred_language;
        this.creation_date = creation_date;
        this.role = role;
        this.co2_saved = co2_saved;
        this.tree_planted = tree_planted;
    }
}

module.exports = User;
