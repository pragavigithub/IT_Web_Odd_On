import 'package:json_annotation/json_annotation.dart';

part 'inventory_transfer.g.dart';

@JsonSerializable()
class InventoryTransfer {
  final int id;
  @JsonKey(name: 'transfer_request_number')
  final String transferRequestNumber;
  @JsonKey(name: 'sap_document_number')
  final String? sapDocumentNumber;
  final String status; // draft, submitted, qc_approved, posted, rejected
  @JsonKey(name: 'user_id')
  final int userId;
  @JsonKey(name: 'qc_approver_id')
  final int? qcApproverId;
  @JsonKey(name: 'qc_approved_at')
  final DateTime? qcApprovedAt;
  @JsonKey(name: 'qc_notes')
  final String? qcNotes;
  @JsonKey(name: 'from_warehouse')
  final String? fromWarehouse;
  @JsonKey(name: 'to_warehouse')
  final String? toWarehouse;
  @JsonKey(name: 'transfer_type')
  final String transferType; // warehouse, bin, emergency
  final String priority; // low, normal, high, urgent
  @JsonKey(name: 'reason_code')
  final String? reasonCode;
  final String? notes;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  
  // Local sync fields
  @JsonKey(name: 'sync_status', defaultValue: 0)
  final int syncStatus; // 0: pending, 1: synced, 2: error
  @JsonKey(name: 'last_synced_at')
  final DateTime? lastSyncedAt;

  const InventoryTransfer({
    required this.id,
    required this.transferRequestNumber,
    this.sapDocumentNumber,
    required this.status,
    required this.userId,
    this.qcApproverId,
    this.qcApprovedAt,
    this.qcNotes,
    this.fromWarehouse,
    this.toWarehouse,
    required this.transferType,
    required this.priority,
    this.reasonCode,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.syncStatus = 0,
    this.lastSyncedAt,
  });

  factory InventoryTransfer.fromJson(Map<String, dynamic> json) => 
      _$InventoryTransferFromJson(json);
  Map<String, dynamic> toJson() => _$InventoryTransferToJson(this);

  bool get isDraft => status == 'draft';
  bool get isSubmitted => status == 'submitted';
  bool get isApproved => status == 'qc_approved';
  bool get isRejected => status == 'rejected';
  bool get isPosted => status == 'posted';
  bool get canEdit => isDraft;
  bool get canSubmit => isDraft;
  bool get canReopen => isRejected;

  String get statusDisplayName {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'qc_approved':
        return 'QC Approved';
      case 'posted':
        return 'Posted';
      case 'rejected':
        return 'Rejected';
      default:
        return status.toUpperCase();
    }
  }

  String get priorityDisplayName {
    switch (priority) {
      case 'low':
        return 'Low';
      case 'normal':
        return 'Normal';
      case 'high':
        return 'High';
      case 'urgent':
        return 'Urgent';
      default:
        return priority.toUpperCase();
    }
  }
}