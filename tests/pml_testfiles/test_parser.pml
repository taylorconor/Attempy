process p {
    action a1 {
        requires { require1 }
        provides { provide1.attr == "val" && provide2.attr == "val2" }
        script { "script1" }
    }

    iteration it1 {
        branch br1 {
            sequence seq1 {
                branch {}
                action a2 {}
            }
        }
    }

    action a3 {}

    sequence {
        action a4{}
        branch br2 {}
        iteration it2 {}
    }

    action a5 {
        script {"script2"}    
        requires {require2}
        agent {carer}
    }
}
