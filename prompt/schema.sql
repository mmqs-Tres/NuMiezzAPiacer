-- ============================================================
--  COMPLETE SQL SCHEMA - Car Sharing / Fleet Management
--  Generated from ER Diagram
-- ============================================================

-- -----------------------------------------------------------
-- ZONE VERTEXES
-- -----------------------------------------------------------
CREATE TABLE zone_vertexes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    sequence_order  INTEGER         NOT NULL,
    latitude        DECIMAL(10,7)   NOT NULL,
    longitude       DECIMAL(10,7)   NOT NULL
);

-- -----------------------------------------------------------
-- ZONE ROLES
-- -----------------------------------------------------------
CREATE TABLE zone_roles (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    type          VARCHAR(50)     NOT NULL,
    color         VARCHAR(20),
    action        VARCHAR(50),
    max_vehicles_qty INTEGER,
    extra_bonus    DECIMAL(10,2),
    user_driven    BOOLEAN         NOT NULL DEFAULT 0,
    radio_with     VARCHAR(50)
);

-- -----------------------------------------------------------
-- AREAS (zones) -- references zone_roles
-- -----------------------------------------------------------
CREATE TABLE areas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_role_id    INTEGER         NOT NULL,
    FOREIGN KEY (zone_role_id) REFERENCES zone_roles(id)
);

-- Area <-> Vertexes (many-to-many junction implied by diagram)
CREATE TABLE area_vertexes (
    area_id         INTEGER NOT NULL,
    vertex_id       INTEGER NOT NULL,
    PRIMARY KEY (area_id, vertex_id),
    FOREIGN KEY (area_id)   REFERENCES areas(id),
    FOREIGN KEY (vertex_id) REFERENCES zone_vertexes(id)
);

-- -----------------------------------------------------------
-- FLEET_NAMES
-- -----------------------------------------------------------
CREATE TABLE fleet_names (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(100)    NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- PARKING_BONUS_RULES
-- -----------------------------------------------------------
CREATE TABLE parking_bonus_rules (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id         INTEGER,
    area            VARCHAR(100),
    extra           DECIMAL(10,2),
    extra_parking   DECIMAL(10,2),
    valid_from      TIMESTAMP,
    valid_to        TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES areas(id)
);

-- -----------------------------------------------------------
-- OPERATORS
-- -----------------------------------------------------------
CREATE TABLE operators (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    operator_code   VARCHAR(50)     NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    api_key         VARCHAR(255),
    FOREIGN KEY (id) REFERENCES fleet_names(id)  -- optional link
);

-- -----------------------------------------------------------
-- CARS
-- -----------------------------------------------------------
CREATE TABLE cars (
    vehicle_id      INTEGER PRIMARY KEY,
    -- additional car-specific columns from ER
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- -----------------------------------------------------------
-- BICYCLES
-- -----------------------------------------------------------
CREATE TABLE bicycles (
    vehicle_id              INTEGER PRIMARY KEY,
    has_child_seat          BOOLEAN NOT NULL DEFAULT 0,
    has_basket              BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- -----------------------------------------------------------
-- SCOOTERS
-- -----------------------------------------------------------
CREATE TABLE scooters (
    vehicle_id              INTEGER PRIMARY KEY,
    vehicle_battery_fc      INTEGER,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- -----------------------------------------------------------
-- VEHICLES  (parent table)
-- -----------------------------------------------------------
CREATE TABLE vehicles (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    fleet_id                    INTEGER,
    plate                       VARCHAR(20),
    current_lat                 DECIMAL(10,7),
    current_lon                 DECIMAL(10,7),
    current_area_id             INTEGER,
    last_maintenance_at         TIMESTAMP,
    last_go                     TIMESTAMP,
    qr_code                     VARCHAR(255),
    imei                        VARCHAR(50),
    status                      VARCHAR(50),
    pricing_product_data_id     INTEGER,
    pricing_product_type        VARCHAR(50),
    pricing_pause_umins         INTEGER,
    find_cost_amount            DECIMAL(10,2),
    specs_id                    INTEGER,
    notes                       TEXT,
    features_range_integer      INTEGER,
    features_range_label        VARCHAR(50),
    features_has_abs            BOOLEAN DEFAULT 0,
    features_has_aircon         BOOLEAN DEFAULT 0,
    features_has_gps_conditions BOOLEAN DEFAULT 0,
    features_supports_rfid      BOOLEAN DEFAULT 0,
    features_supports_nfc       BOOLEAN DEFAULT 0,
    features_supports_pin       BOOLEAN DEFAULT 0,
    features_supports_rfid_partners INTEGER,
    features_supports_nfc_partners  INTEGER,
    features_supports_pin_partners  INTEGER,
    battery_level               INTEGER,
    battery_last_updated        TIMESTAMP,
    FOREIGN KEY (fleet_id)      REFERENCES fleet_names(id),
    FOREIGN KEY (current_area_id) REFERENCES areas(id)
);

-- -----------------------------------------------------------
-- VEHICLE_POSITION_HISTORY
-- -----------------------------------------------------------
CREATE TABLE vehicle_position_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id      INTEGER         NOT NULL,
    latitude        DECIMAL(10,7)   NOT NULL,
    longitude       DECIMAL(10,7)   NOT NULL,
    logged_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accuracy_m      DECIMAL(8,2),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- -----------------------------------------------------------
-- VEHICLE_CONDITION_REPO (segnalazioni condizione veicolo)
-- -----------------------------------------------------------
CREATE TABLE vehicle_condition_repo (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id      INTEGER         NOT NULL,
    reported_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category        VARCHAR(50),
    severity        VARCHAR(50),
    notes           TEXT,
    images          TEXT,  -- JSON array of image URLs
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- -----------------------------------------------------------
-- RIDES  (corse)
-- -----------------------------------------------------------
CREATE TABLE rides (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id             INTEGER         NOT NULL,
    vehicle_id              INTEGER         NOT NULL,
    started_at              TIMESTAMP       NOT NULL,
    ended_at                TIMESTAMP,
    origin_lat              DECIMAL(10,7),
    origin_lon              DECIMAL(10,7),
    origin_area_id          INTEGER,
    dest_lat                DECIMAL(10,7),
    dest_lon                DECIMAL(10,7),
    dest_area_id            INTEGER,
    debt_flag               BOOLEAN         NOT NULL DEFAULT 0,
    distance_m              DECIMAL(10,2),
    estimated_cost_per_min  DECIMAL(10,4),
    final_cost_per_min      DECIMAL(10,4),
    promo_id                INTEGER,
    FOREIGN KEY (customer_id)   REFERENCES customers(id),
    FOREIGN KEY (vehicle_id)    REFERENCES vehicles(id),
    FOREIGN KEY (origin_area_id) REFERENCES areas(id),
    FOREIGN KEY (dest_area_id)  REFERENCES areas(id),
    FOREIGN KEY (promo_id)      REFERENCES promotions(id)
);

-- -----------------------------------------------------------
-- SUPPORT_TICKETS
-- -----------------------------------------------------------
CREATE TABLE support_tickets (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    related_vehicle_id  INTEGER,
    related_ride_id     INTEGER,
    assigned_operator   INTEGER,
    category            VARCHAR(50),
    notes               TEXT,
    status              VARCHAR(50)     NOT NULL DEFAULT 'open',
    closed_at           TIMESTAMP,
    FOREIGN KEY (related_vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (related_ride_id)    REFERENCES rides(id),
    FOREIGN KEY (assigned_operator)  REFERENCES operators(id)
);

-- -----------------------------------------------------------
-- PROMOTIONS
-- -----------------------------------------------------------
CREATE TABLE promotions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           VARCHAR(100),
    code            VARCHAR(50)     UNIQUE,
    valid_from      TIMESTAMP,
    valid_to        TIMESTAMP,
    discount_type   VARCHAR(20),    -- 'percent' | 'fixed'
    discount_value  DECIMAL(10,2),
    is_active       BOOLEAN         NOT NULL DEFAULT 1,
    la_prova        VARCHAR(50)     -- campo aggiuntivo visibile nel diagramma
);

-- -----------------------------------------------------------
-- USERS  (base auth table)
-- -----------------------------------------------------------
CREATE TABLE users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    role            VARCHAR(50)     NOT NULL DEFAULT 'customer',
    city            VARCHAR(100),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at   TIMESTAMP,
    arc_born        DATE
);

-- -----------------------------------------------------------
-- CUSTOMERS  (extends users)
-- -----------------------------------------------------------
CREATE TABLE customers (
    id                          INTEGER PRIMARY KEY,  -- same as users.id
    customer_subscription_id    INTEGER,
    driving_license_code        VARCHAR(50),
    driving_license_expiry      DATE,
    FOREIGN KEY (id) REFERENCES users(id),
    FOREIGN KEY (customer_subscription_id) REFERENCES payment_methods(id)
);

-- -----------------------------------------------------------
-- PAYMENT_METHODS
-- -----------------------------------------------------------
CREATE TABLE payment_methods (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id     INTEGER         NOT NULL,
    type            VARCHAR(30),    -- 'card' | 'paypal' | etc.
    token           VARCHAR(255),
    provider        VARCHAR(50),
    expires_at      DATE,
    is_default      BOOLEAN         NOT NULL DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- -----------------------------------------------------------
-- BOOKINGS
-- -----------------------------------------------------------
CREATE TABLE bookings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id     INTEGER         NOT NULL,
    vehicle_id      INTEGER         NOT NULL,
    booked_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMP       NOT NULL,
    confirmed       BOOLEAN         NOT NULL DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (vehicle_id)  REFERENCES vehicles(id)
);

-- -----------------------------------------------------------
-- PUBLIC_ADMINISTRATION  (enti convenzionati)
-- -----------------------------------------------------------
CREATE TABLE public_administration (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER         NOT NULL UNIQUE,
    department      VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- -----------------------------------------------------------
-- MOBILITY_REPORTS  (report per PA / operatori)
-- -----------------------------------------------------------
CREATE TABLE mobility_reports (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    generated_by_admin  INTEGER,
    generated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    period_from         DATE,
    period_to           DATE,
    file_name           VARCHAR(255),
    FOREIGN KEY (generated_by_admin) REFERENCES public_administration(id)
);

-- -----------------------------------------------------------
-- INDEXES  (performance)
-- -----------------------------------------------------------
CREATE INDEX idx_vehicles_fleet         ON vehicles(fleet_id);
CREATE INDEX idx_vehicles_area          ON vehicles(current_area_id);
CREATE INDEX idx_rides_customer         ON rides(customer_id);
CREATE INDEX idx_rides_vehicle          ON rides(vehicle_id);
CREATE INDEX idx_rides_started_at       ON rides(started_at);
CREATE INDEX idx_position_history_vid   ON vehicle_position_history(vehicle_id);
CREATE INDEX idx_bookings_vehicle       ON bookings(vehicle_id);
CREATE INDEX idx_bookings_customer      ON bookings(customer_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
