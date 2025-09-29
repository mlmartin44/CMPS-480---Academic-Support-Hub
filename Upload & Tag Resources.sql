create table Users (
user_id int auto_increment primary key,
name varchar(100) not null,
email varchar(100) unique not null,
role enum('student','profeddor','admin') not null
);

create table Courses (
course_id int auto_increment primary key,
course_name varchar(100) not null,
major varchar(100),
instructor_id int,
foreign key (instructor_id) references Users(user_id)
);

create table StudyMaterial (
material_id int auto_increment primary key,
title varchar(200) not null,
description text,
file_url varchar(255) not null,
upload_date timestamp default current_timestamp,
user_id int not null,
course_id int not null, 
foreign key (user_id) references Users(user_id),
foreign key (course_id) references Courses(course_id)
);

create table Tags (
tag_id int auto_increment primary key,
tag_name varchar(100) unique not null
);

create table MaterialTags (
material_id int not null,
tag_id int not null,
primary key (material_id, tag_id),
foreign key (material_id) references StudyMaterial(material_id),
foreign key (tag_id) references Tags(tag_id)
);