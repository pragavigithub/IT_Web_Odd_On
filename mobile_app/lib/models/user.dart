import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final int id;
  final String username;
  final String email;
  @JsonKey(name: 'first_name')
  final String? firstName;
  @JsonKey(name: 'last_name')
  final String? lastName;
  final String role; // admin, manager, user, qc
  @JsonKey(name: 'branch_code')
  final String? branchCode;
  @JsonKey(name: 'is_active')
  final bool isActive;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;

  const User({
    required this.id,
    required this.username,
    required this.email,
    this.firstName,
    this.lastName,
    required this.role,
    this.branchCode,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);

  String get fullName => '${firstName ?? ''} ${lastName ?? ''}'.trim();
  
  bool get isAdmin => role == 'admin';
  bool get isManager => role == 'manager';
  bool get isQC => role == 'qc';
  bool get isUser => role == 'user';

  bool hasPermission(String permission) {
    final rolePermissions = {
      'admin': ['dashboard', 'grpo', 'inventory_transfer', 'pick_list', 'inventory_counting', 'qc_dashboard', 'barcode_labels'],
      'manager': ['dashboard', 'grpo', 'inventory_transfer', 'pick_list', 'inventory_counting', 'qc_dashboard', 'barcode_labels'],
      'qc': ['dashboard', 'qc_dashboard', 'barcode_labels'],
      'user': ['dashboard', 'grpo', 'inventory_transfer', 'pick_list', 'inventory_counting', 'barcode_labels']
    };
    return rolePermissions[role]?.contains(permission) ?? false;
  }

  User copyWith({
    int? id,
    String? username,
    String? email,
    String? firstName,
    String? lastName,
    String? role,
    String? branchCode,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      role: role ?? this.role,
      branchCode: branchCode ?? this.branchCode,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}