import java.util.*;
class Node{
    int data;
    Node next;

    Node(int data){
        this.data = data;
        this.next = null;
    }
}

class LL{
    Node head = null;
    Node tail = null;
    int size = 0;

    void addEle(int data){
        Node newNode = new Node(data);

        if(head == null){
            head = newNode;
            tail = newNode;
        }
        else{
            tail.next = newNode;
            tail = newNode;
        }
        
    }

    void displayNodes(){
        Node temp = head;

        if(temp == null){
            System.out.println("List is empty");
        }
        while(temp != null){
            System.out.print(temp.data + " -> ");
            temp = temp.next;
        }
        System.out.print(" null");
    }

    void getSize(){
        Node temp = head;
        while(temp != null){
            size++;
            temp = temp.next;
        }
        System.out.println(size);
    }

    void insertAtbeginning(int data){
        Node newNode = new Node(data);

        newNode.next = head;
        head = newNode;
    }

    void insertAtEnd(int data){
        Node newNode = new Node(data);

        tail.next = newNode;
        tail = newNode;
    }

    void insertAtPosition(int data, int k){
        Node newNode = new Node(data);
        Node curr = head;

        for(int i = 1; i < k-1; i++){
            curr = curr.next;
        }
        newNode.next = curr.next;
        curr.next = newNode;

    }

    void removeLast(){
        Node temp = head;
        if(temp == null || temp.next == null) System.out.println("null");

        while(temp.next.next != null){
            temp = temp.next;

        }
        temp.next = null;
    }

    void removeFirst(){
        Node temp = head;
        if(temp == null || temp.next == null) System.out.println("null");
        head = temp.next;
    }

    void removeAtPos(int k){
        Node temp = head;
        Node prev = null;
        int cnt = 0;

        if(k == 1) removeFirst();
        if(temp == null) System.out.println(head);

        while(temp != null){
            cnt++;
            
            if(cnt == k){
                prev.next = prev.next.next;
                break;
            }
            prev = temp;
            temp = temp.next;
        }

    }

    void removeElement(int val){
        Node dummy = new Node(-1);
        dummy.next = head;
        
        Node curr = dummy;

        while(curr.next != null){
            if(curr.next.data == val){
                curr.next = curr.next.next;
            }
            curr = curr.next;

        }
    }
    
    void reverse(){
        Node prev = null;
        Node temp = head;

        while(temp != null){
            Node front = temp.next;
            temp.next = prev;
            prev = temp;
            temp = front;
        }

        head = prev;
    }
    
    void checkPalindrome(){
        Node temp = head;
        Stack<Integer> st = new Stack<>();

        while(temp != null){
            st.push(temp.data);
            temp = temp.next;
        }

        temp = head;
        while(temp != null){
            if(st.peek() != temp.data){
                System.out.println(false);
                break;
            }
            temp = temp.next;
            st.pop();
        }

        System.out.println(true);

    }

    public static void main(String[] args) {
        LL ll = new LL();

        ll.addEle(3);
        ll.addEle(9);
        ll.addEle(6);
        ll.addEle(2);

        ll.checkPalindrome();


    }
}